import {
  CatalogOrderStatus,
  OrderCancellationKind,
  OrderCancellationStatus,
  Prisma
} from '@prisma/client';
import prisma from '../../../config/prisma';
import type { AuthUser } from '../../request/types/express';
import { badRequest, conflict, forbidden, notFound } from '../../request/utils/apiError';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';
import { isTerminalOrderStatus } from '../../../shared/catalogOrderStatus';
import ShopService from '../../shop/services/shop.service';
import DealService from '../../deal/services/deal.service';

type ResolvedOrder = {
  kind: OrderCancellationKind;
  orderId: string;
  buyerId: string;
  sellerId: string;
  status: CatalogOrderStatus;
  title: string;
  total: number;
  currency: string;
  buyerName: string;
  sellerName: string;
};

export class OrderCancellationService {
  constructor(
    private readonly shopService: ShopService,
    private readonly dealService: DealService
  ) {}

  private async resolveOrder(orderId: string): Promise<ResolvedOrder | null> {
    const catalog = await prisma.catalogOrder.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        lines: { take: 1, orderBy: { id: 'asc' } }
      }
    });
    if (catalog != null) {
      const title = catalog.lines[0]?.title ?? 'Catalog order';
      return {
        kind: OrderCancellationKind.catalog,
        orderId: catalog.id,
        buyerId: catalog.buyerId,
        sellerId: catalog.sellerId,
        status: catalog.status,
        title,
        total: Number(catalog.total),
        currency: catalog.currency,
        buyerName: catalog.buyer.name,
        sellerName: catalog.seller.name
      };
    }

    const deal = await prisma.requestDealOrder.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } }
      }
    });
    if (deal != null) {
      return {
        kind: OrderCancellationKind.request_deal,
        orderId: deal.id,
        buyerId: deal.buyerId,
        sellerId: deal.sellerId,
        status: deal.status,
        title: deal.title,
        total: Number(deal.amount),
        currency: deal.currency,
        buyerName: deal.buyer.name,
        sellerName: deal.seller.name
      };
    }

    return null;
  }

  private assertParticipant(user: AuthUser, order: ResolvedOrder): void {
    if (user.role === 'admin') return;
    if (user.id !== order.buyerId && user.id !== order.sellerId) {
      throw forbidden('You are not a participant in this order');
    }
  }

  private serialize(row: {
    id: string;
    orderKind: OrderCancellationKind;
    orderId: string;
    reason: string;
    status: OrderCancellationStatus;
    adminNote: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: { id: string; name: string };
    reviewedBy: { id: string; name: string } | null;
  }, order?: ResolvedOrder | null) {
    return {
      id: row.id,
      orderKind: row.orderKind,
      orderId: row.orderId,
      reason: row.reason,
      status: row.status,
      adminNote: row.adminNote,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      requestedBy: row.requestedBy,
      reviewedBy: row.reviewedBy,
      order: order
        ? {
            title: order.title,
            total: order.total,
            currency: order.currency,
            status: order.status,
            buyer: { id: order.buyerId, name: order.buyerName },
            seller: { id: order.sellerId, name: order.sellerName }
          }
        : null
    };
  }

  async create(user: AuthUser, orderId: string, reason: string) {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      throw badRequest('Please describe why you want to cancel (at least 5 characters)');
    }

    const order = await this.resolveOrder(orderId);
    if (order == null) {
      throw notFound('Order not found');
    }

    this.assertParticipant(user, order);

    if (isTerminalOrderStatus(order.status)) {
      throw badRequest('This order is already closed');
    }

    const pending = await prisma.orderCancellationRequest.findFirst({
      where: {
        orderId,
        orderKind: order.kind,
        status: OrderCancellationStatus.pending
      }
    });
    if (pending != null) {
      throw conflict('A cancellation request is already pending for this order');
    }

    const row = await prisma.orderCancellationRequest.create({
      data: {
        orderKind: order.kind,
        orderId,
        requestedById: user.id,
        reason: trimmed
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    return this.serialize(row, order);
  }

  async listMine(user: AuthUser, page: number, limit: number) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.OrderCancellationRequestWhereInput = { requestedById: user.id };

    const [total, rows] = await Promise.all([
      prisma.orderCancellationRequest.count({ where }),
      prisma.orderCancellationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          requestedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } }
        }
      })
    ]);

    const items = await Promise.all(
      rows.map(async (row) => this.serialize(row, await this.resolveOrder(row.orderId)))
    );

    return { items, meta: buildPageMeta(p, l, total) };
  }

  async getForOrder(user: AuthUser, orderId: string) {
    const order = await this.resolveOrder(orderId);
    if (order == null) {
      throw notFound('Order not found');
    }
    this.assertParticipant(user, order);

    const row = await prisma.orderCancellationRequest.findFirst({
      where: {
        orderId,
        orderKind: order.kind,
        status: OrderCancellationStatus.pending
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    if (row == null) {
      return null;
    }

    return this.serialize(row, order);
  }

  async listAdmin(page: number, limit: number, status?: OrderCancellationStatus) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.OrderCancellationRequestWhereInput =
      status != null ? { status } : {};

    const [total, rows] = await Promise.all([
      prisma.orderCancellationRequest.count({ where }),
      prisma.orderCancellationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          requestedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } }
        }
      })
    ]);

    const items = await Promise.all(
      rows.map(async (row) => this.serialize(row, await this.resolveOrder(row.orderId)))
    );

    return { items, meta: buildPageMeta(p, l, total) };
  }

  private async cancelOrderAsAdmin(admin: AuthUser, row: {
    orderKind: OrderCancellationKind;
    orderId: string;
  }) {
    if (row.orderKind === OrderCancellationKind.catalog) {
      await this.shopService.patchOrderAdmin(admin, row.orderId, {
        status: CatalogOrderStatus.cancelled
      });
      return;
    }
    await this.dealService.patchRequestOrderAdmin(row.orderId, {
      status: CatalogOrderStatus.cancelled
    });
  }

  async approve(admin: AuthUser, requestId: string, adminNote?: string) {
    const row = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });
    if (row == null) {
      throw notFound('Cancellation request not found');
    }
    if (row.status !== OrderCancellationStatus.pending) {
      throw badRequest('This request was already reviewed');
    }

    const order = await this.resolveOrder(row.orderId);
    if (order == null) {
      throw notFound('Order not found');
    }
    if (!isTerminalOrderStatus(order.status)) {
      await this.cancelOrderAsAdmin(admin, row);
    }

    const updated = await prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: {
        status: OrderCancellationStatus.approved,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        adminNote: adminNote?.trim() || null
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    return this.serialize(updated, order);
  }

  async reject(admin: AuthUser, requestId: string, adminNote?: string) {
    const row = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId }
    });
    if (row == null) {
      throw notFound('Cancellation request not found');
    }
    if (row.status !== OrderCancellationStatus.pending) {
      throw badRequest('This request was already reviewed');
    }

    const order = await this.resolveOrder(row.orderId);

    const updated = await prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: {
        status: OrderCancellationStatus.rejected,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        adminNote: adminNote?.trim() || null
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });

    return this.serialize(updated, order);
  }
}

export default OrderCancellationService;
