import { CatalogOrderStatus, Prisma } from '@prisma/client';
import prisma from '../../../config/prisma';
import type { AuthUser } from '../../request/types/express';
import { badRequest, conflict, forbidden, notFound } from '../../offer/utils/apiError';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';
import type { DealEventPublisherLike } from './deal-event.service';
import {
  assertOrderStatusTransition,
  parseCatalogOrderStatus,
  resolveOrderActor
} from '../../../shared/catalogOrderStatus';
import {
  computeOfferLineTotal,
  normalizeRequestQuantity,
  roundMoney
} from '../../../shared/offerPricing';

const dealOrderShopInclude = {
  buyer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true } },
  request: {
    select: {
      id: true,
      quantity: true,
      attachments: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { fileUrl: true }
      }
    }
  }
} satisfies Prisma.RequestDealOrderInclude;

type DealOrderForShop = Prisma.RequestDealOrderGetPayload<{ include: typeof dealOrderShopInclude }>;

function toNumber(value: Prisma.Decimal | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function assertConversationParticipant(conv: { buyerId: string; sellerId: string }, userId: string): void {
  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    throw forbidden('Only chat participants can use deal actions');
  }
}

function serializeShopLikeOrder(row: DealOrderForShop) {
  const total = toNumber(row.amount);
  const qty = normalizeRequestQuantity(row.request?.quantity);
  const unitPrice = qty > 0 ? roundMoney(total / qty) : total;
  const imageUrl = row.request?.attachments?.[0]?.fileUrl?.trim() ?? '';
  return {
    id: row.id,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    status: row.status,
    currency: row.currency,
    subtotal: total,
    shippingAmount: 0,
    total,
    shippingName: null as string | null,
    shippingPhone: null as string | null,
    shippingAddress: null as string | null,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paidAt: row.paidAt.toISOString(),
    buyer: row.buyer,
    seller: row.seller,
    lines: [
      {
        id: `${row.id}-line`,
        productId: row.requestId,
        productSlug: 'request-deal',
        requestId: row.requestId,
        title: row.title,
        imageUrl,
        unitPrice,
        currency: row.currency,
        quantity: qty
      }
    ]
  };
}

export class DealService {
  constructor(private readonly events: DealEventPublisherLike) {}

  async getDealState(user: AuthUser, conversationId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        request: { select: { id: true, title: true, currency: true, quantity: true } },
        offer: { select: { id: true, price: true, currency: true, status: true } }
      }
    });
    if (conv == null) {
      throw notFound('Conversation not found');
    }
    assertConversationParticipant(conv, user.id);

    const [proposals, order] = await Promise.all([
      prisma.priceProposal.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.requestDealOrder.findUnique({
        where: { conversationId },
        select: { id: true }
      })
    ]);

    return {
      proposals: proposals.map((p) => ({
        id: p.id,
        proposerId: p.proposerId,
        amount: toNumber(p.amount),
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString()
      })),
      agreedPrice: conv.agreedPrice != null ? toNumber(conv.agreedPrice) : null,
      agreedCurrency: conv.agreedCurrency,
      agreedAt: conv.agreedAt?.toISOString() ?? null,
      requestTitle: conv.request.title,
      requestCurrency: conv.request.currency,
      requestQuantity: normalizeRequestQuantity(conv.request.quantity),
      initialOffer:
        conv.offer != null
          ? (() => {
              const unitPrice = toNumber(conv.offer.price);
              const requestQuantity = normalizeRequestQuantity(conv.request.quantity);
              const totalPrice = computeOfferLineTotal(unitPrice, requestQuantity);
              return {
                id: conv.offer.id,
                unitPrice,
                totalPrice,
                price: unitPrice,
                quantity: requestQuantity,
                currency: conv.offer.currency,
                status: conv.offer.status
              };
            })()
          : null,
      orderId: order?.id ?? null
    };
  }

  async applyInitialOfferTotal(user: AuthUser, conversationId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        request: { select: { currency: true, quantity: true } },
        offer: { select: { price: true, currency: true } }
      }
    });
    if (conv == null) {
      throw notFound('Conversation not found');
    }
    assertConversationParticipant(conv, user.id);
    if (conv.offer == null) {
      throw badRequest('No offer linked to this conversation');
    }

    const unitPrice = toNumber(conv.offer.price);
    const requestQuantity = normalizeRequestQuantity(conv.request.quantity);
    const total = computeOfferLineTotal(unitPrice, requestQuantity);
    const currency = conv.offer.currency.trim().toUpperCase();

    return this.createPriceProposal(user, conversationId, { amount: total, currency });
  }

  async createPriceProposal(user: AuthUser, conversationId: string, input: { amount: number; currency: string }) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { request: { select: { currency: true } } }
    });
    if (conv == null) {
      throw notFound('Conversation not found');
    }
    assertConversationParticipant(conv, user.id);

    const existingOrder = await prisma.requestDealOrder.findUnique({ where: { conversationId } });
    if (existingOrder != null) {
      throw conflict('This conversation already has a paid order');
    }

    const currency = input.currency.trim().toUpperCase();
    if (currency.length !== 3) {
      throw badRequest('currency must be a 3-letter code');
    }

    await prisma.$transaction(async (tx) => {
      if (conv.agreedPrice != null) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            agreedPrice: null,
            agreedCurrency: null,
            agreedAt: null,
            agreedProposalId: null
          }
        });
        await tx.priceProposal.updateMany({
          where: { conversationId, status: { in: ['pending', 'accepted'] } },
          data: { status: 'superseded' }
        });
      }

      await tx.priceProposal.updateMany({
        where: { conversationId, proposerId: user.id, status: 'pending' },
        data: { status: 'superseded' }
      });

      await tx.priceProposal.create({
        data: {
          conversationId,
          proposerId: user.id,
          amount: input.amount,
          currency
        }
      });
    });

    return this.getDealState(user, conversationId);
  }

  async acceptPriceProposal(user: AuthUser, proposalId: string) {
    const proposal = await prisma.priceProposal.findUnique({
      where: { id: proposalId },
      include: { conversation: true }
    });
    if (proposal == null) {
      throw notFound('Proposal not found');
    }
    if (proposal.status !== 'pending') {
      throw badRequest('Only pending proposals can be accepted');
    }
    assertConversationParticipant(proposal.conversation, user.id);
    if (proposal.proposerId === user.id) {
      throw forbidden('You cannot accept your own price proposal');
    }

    const existingOrder = await prisma.requestDealOrder.findUnique({
      where: { conversationId: proposal.conversationId }
    });
    if (existingOrder != null) {
      throw conflict('Order already exists for this conversation');
    }

    await prisma.$transaction(async (tx) => {
      await tx.priceProposal.updateMany({
        where: {
          conversationId: proposal.conversationId,
          status: 'pending',
          id: { not: proposal.id }
        },
        data: { status: 'superseded' }
      });
      await tx.priceProposal.update({
        where: { id: proposal.id },
        data: { status: 'accepted' }
      });
      await tx.conversation.update({
        where: { id: proposal.conversationId },
        data: {
          agreedPrice: proposal.amount,
          agreedCurrency: proposal.currency,
          agreedAt: new Date(),
          agreedProposalId: proposal.id
        }
      });
    });

    return this.getDealState(user, proposal.conversationId);
  }

  async demoPay(user: AuthUser, conversationId: string, _cardLast4: string, _cardHolderName?: string) {
    void _cardLast4;
    void _cardHolderName;
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { request: { select: { id: true, title: true, quantity: true } } }
    });
    if (conv == null) {
      throw notFound('Conversation not found');
    }
    if (conv.buyerId !== user.id) {
      throw forbidden('Only the buyer on this thread can pay');
    }
    if (user.canBuy === false) {
      throw forbidden('Your account cannot complete buyer payments');
    }
    if (conv.agreedPrice == null || conv.agreedCurrency == null) {
      throw badRequest('Agree on a price in chat before paying');
    }

    const dup = await prisma.requestDealOrder.findUnique({ where: { conversationId } });
    if (dup != null) {
      throw conflict('Payment already completed for this conversation');
    }

    const amount = conv.agreedPrice;
    const currency = conv.agreedCurrency;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.requestDealOrder.create({
        data: {
          conversationId,
          requestId: conv.requestId,
          buyerId: conv.buyerId,
          sellerId: conv.sellerId,
          title: conv.request.title,
          amount,
          currency,
          status: CatalogOrderStatus.paid
        },
        include: dealOrderShopInclude
      });

      return created;
    });

    await this.events.publishRequestDealPaid({
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      title: order.title,
      amount: toNumber(order.amount),
      currency: order.currency
    });

    return serializeShopLikeOrder(order);
  }

  async listMyRequestOrders(user: AuthUser, page: number, limit: number, status?: string) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const st = this.parseOrderStatus(status);
    const where =
      user.role === 'seller'
        ? { sellerId: user.id, ...(st != null ? { status: st } : {}) }
        : { buyerId: user.id, ...(st != null ? { status: st } : {}) };

    const [total, items] = await Promise.all([
      prisma.requestDealOrder.count({ where }),
      prisma.requestDealOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: dealOrderShopInclude
      })
    ]);

    return {
      items: items.map((row) => serializeShopLikeOrder(row)),
      meta: buildPageMeta(p, l, total)
    };
  }

  async getMyRequestOrder(user: AuthUser, orderId: string) {
    const row = await prisma.requestDealOrder.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: user.id }, { sellerId: user.id }]
      },
      include: dealOrderShopInclude
    });
    if (row == null) {
      throw notFound('Order not found');
    }
    return serializeShopLikeOrder(row);
  }

  async patchMyRequestOrderStatus(
    user: AuthUser,
    orderId: string,
    input: {
      status: CatalogOrderStatus;
      trackingNumber?: string | null;
      carrier?: string | null;
    }
  ) {
    const current = await prisma.requestDealOrder.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: user.id }, { sellerId: user.id }]
      }
    });
    if (current == null) {
      throw notFound('Order not found');
    }

    const actor = resolveOrderActor(user, current);
    if (actor == null) {
      throw forbidden('You cannot update this order');
    }

    assertOrderStatusTransition(actor, current.status, input.status);

    if (actor !== 'seller' && (input.trackingNumber !== undefined || input.carrier !== undefined)) {
      throw forbidden('Only the seller can update tracking details');
    }

    const previousStatus = current.status;
    const data: {
      status: CatalogOrderStatus;
      trackingNumber?: string | null;
      carrier?: string | null;
      sellerCreditedAt?: Date;
    } = { status: input.status };

    if (input.trackingNumber !== undefined) {
      data.trackingNumber = input.trackingNumber;
    }
    if (input.carrier !== undefined) {
      data.carrier = input.carrier;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (
        input.status === CatalogOrderStatus.completed &&
        current.sellerCreditedAt == null
      ) {
        await tx.user.update({
          where: { id: current.sellerId },
          data: { walletBalance: { increment: current.amount } }
        });
        data.sellerCreditedAt = new Date();
      }

      return tx.requestDealOrder.update({
        where: { id: orderId },
        data,
        include: dealOrderShopInclude
      });
    });

    if (updated.status !== previousStatus) {
      await this.events.publishRequestDealStatusChanged({
        orderId: updated.id,
        buyerId: updated.buyerId,
        sellerId: updated.sellerId,
        title: updated.title,
        previousStatus,
        newStatus: updated.status
      });
    }

    return serializeShopLikeOrder(updated);
  }

  async listRequestOrdersAdmin(page: number, limit: number, status?: string) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const st = this.parseOrderStatus(status);
    const where = st != null ? { status: st } : {};

    const [total, items] = await Promise.all([
      prisma.requestDealOrder.count({ where }),
      prisma.requestDealOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: dealOrderShopInclude
      })
    ]);

    return {
      items: items.map((r) => serializeShopLikeOrder(r)),
      meta: buildPageMeta(p, l, total)
    };
  }

  async patchRequestOrderAdmin(orderId: string, input: {
    status?: CatalogOrderStatus;
    trackingNumber?: string | null;
    carrier?: string | null;
  }) {
    const current = await prisma.requestDealOrder.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } }
      }
    });
    if (current == null) {
      throw notFound('Order not found');
    }

    const previousStatus = current.status;
    const data: {
      status?: CatalogOrderStatus;
      trackingNumber?: string | null;
      carrier?: string | null;
    } = {};
    if (input.status !== undefined) {
      if (input.status !== CatalogOrderStatus.cancelled) {
        throw forbidden('Admins can only cancel orders or update tracking details');
      }
      assertOrderStatusTransition('admin', current.status, input.status);
      data.status = input.status;
    }
    if (input.trackingNumber !== undefined) data.trackingNumber = input.trackingNumber;
    if (input.carrier !== undefined) data.carrier = input.carrier;

    if (Object.keys(data).length === 0) {
      throw badRequest('No changes');
    }

    const updated = await prisma.requestDealOrder.update({
      where: { id: orderId },
      data,
      include: dealOrderShopInclude
    });

    if (input.status !== undefined && updated.status !== previousStatus) {
      await this.events.publishRequestDealStatusChanged({
        orderId: updated.id,
        buyerId: updated.buyerId,
        sellerId: updated.sellerId,
        title: updated.title,
        previousStatus,
        newStatus: updated.status
      });
    }

    return serializeShopLikeOrder(updated);
  }

  async deleteRequestOrderAdmin(orderId: string): Promise<void> {
    try {
      await prisma.requestDealOrder.delete({ where: { id: orderId } });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw notFound('Order not found');
      }
      throw e;
    }
  }

  async getWallet(user: AuthUser) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { walletBalance: true }
    });
    if (row == null) {
      throw notFound('User not found');
    }
    return { balance: toNumber(row.walletBalance) };
  }

  async demoWithdraw(user: AuthUser, amount: number, _cardLast4: string, _cardHolderName: string) {
    if (user.role !== 'seller') {
      throw forbidden('Only sellers can withdraw balance');
    }
    void _cardLast4;
    void _cardHolderName;
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { walletBalance: true }
    });
    if (row == null) {
      throw notFound('User not found');
    }
    const bal = toNumber(row.walletBalance);
    if (amount > bal) {
      throw badRequest('Amount exceeds available balance');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { walletBalance: { decrement: amount } }
    });

    return { ok: true as const, withdrawn: amount, balance: bal - amount };
  }

  private parseOrderStatus(status?: string): CatalogOrderStatus | undefined {
    return parseCatalogOrderStatus(status);
  }
}

export default DealService;
