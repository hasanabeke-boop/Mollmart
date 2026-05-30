import crypto from 'crypto';
import { CatalogOrderStatus, Prisma } from '@prisma/client';
import config from '../../../config/config';
import prisma from '../../../config/prisma';
import type { WorkspaceAuthUser } from '../../../shared/authenticateWorkspace';
import { badRequest, conflict, forbidden, notFound, serviceUnavailable } from '../../offer/utils/apiError';
import { convertUsdQuoted, getUsdQuoteRates, roundCatalogMoney } from '../../catalog/services/exchangeRates';
import ShopEventPublisher, { type ShopEventPublisherLike } from '../../shop/services/shop-event.service';
import DealEventPublisher, { type DealEventPublisherLike } from '../../deal/services/deal-event.service';
import { computeOfferLineTotal, normalizeRequestQuantity } from '../../../shared/offerPricing';

type CartSnapshotLine = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
};

type CartSnapshotGroup = {
  sellerId: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  lines: CartSnapshotLine[];
};

type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF'
]);

function toStripeAmount(amount: number, currency: string): number {
  const cur = currency.trim().toUpperCase();
  const multiplier = ZERO_DECIMAL_CURRENCIES.has(cur) ? 1 : 100;
  return Math.round(amount * multiplier);
}

function assertStripeReady(): void {
  if (!config.stripe.enabled) {
    throw serviceUnavailable('Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable real payments.');
  }
}

function assertStripeCurrency(currency: string): string {
  const cur = currency.trim().toUpperCase();
  if (!config.stripe.allowedCurrencies.includes(cur)) {
    throw badRequest(`Stripe payments are not enabled for ${cur}.`);
  }
  return cur;
}

function buildReturnUrl(path: string): string {
  return `${config.frontend.url}${path}`;
}

async function createStripeCheckoutSession(params: URLSearchParams): Promise<StripeCheckoutSession> {
  assertStripeReady();
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.stripe.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  const data = (await res.json().catch(() => ({}))) as StripeCheckoutSession & { error?: { message?: string } };
  if (!res.ok) {
    throw serviceUnavailable(data.error?.message || `Stripe session failed (${res.status})`);
  }
  if (!data.url) {
    throw serviceUnavailable('Stripe did not return a checkout URL.');
  }
  return data;
}

function appendLineItem(
  params: URLSearchParams,
  index: number,
  input: { name: string; unitAmount: number; currency: string; quantity: number }
): void {
  params.set(`line_items[${index}][price_data][currency]`, input.currency.toLowerCase());
  params.set(`line_items[${index}][price_data][product_data][name]`, input.name.slice(0, 120));
  params.set(`line_items[${index}][price_data][unit_amount]`, String(input.unitAmount));
  params.set(`line_items[${index}][quantity]`, String(input.quantity));
}

export class PaymentService {
  constructor(
    private readonly shopEvents: ShopEventPublisherLike = new ShopEventPublisher(),
    private readonly dealEvents: DealEventPublisherLike = new DealEventPublisher()
  ) {}

  getConfig() {
    return {
      stripeEnabled: config.stripe.enabled,
      allowedCurrencies: config.stripe.allowedCurrencies
    };
  }

  async createRequestDealCheckoutSession(user: WorkspaceAuthUser, conversationId: string) {
    if (user.canBuy === false) {
      throw forbidden('Your account cannot complete buyer payments');
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { request: { select: { title: true, quantity: true } } }
    });
    if (conv == null) throw notFound('Conversation not found');
    if (conv.buyerId !== user.id) throw forbidden('Only the buyer on this thread can pay');
    if (conv.agreedPrice == null || conv.agreedCurrency == null) {
      throw badRequest('Agree on a price in chat before paying');
    }
    const existingOrder = await prisma.requestDealOrder.findUnique({ where: { conversationId } });
    if (existingOrder != null) throw conflict('Payment already completed for this conversation');

    const currency = assertStripeCurrency(conv.agreedCurrency);
    const amount = Number(conv.agreedPrice);
    const params = new URLSearchParams({
      mode: 'payment',
      success_url: buildReturnUrl(`/chat?c=${encodeURIComponent(conversationId)}&payment=stripe-success`),
      cancel_url: buildReturnUrl(`/chat?c=${encodeURIComponent(conversationId)}&payment=stripe-cancelled`),
      'metadata[kind]': 'request_deal',
      'metadata[userId]': user.id,
      'metadata[conversationId]': conversationId
    });
    appendLineItem(params, 0, {
      name: conv.request.title,
      unitAmount: toStripeAmount(amount, currency),
      currency,
      quantity: 1
    });

    const session = await createStripeCheckoutSession(params);
    await prisma.paymentSession.create({
      data: {
        userId: user.id,
        kind: 'request_deal',
        stripeSessionId: session.id,
        conversationId,
        checkoutCurrency: currency,
        status: 'pending'
      }
    });
    return { id: session.id, url: session.url };
  }

  async createCartCheckoutSession(
    user: WorkspaceAuthUser,
    input: {
      checkoutCurrency: string;
      shippingName?: string | null;
      shippingPhone?: string | null;
      shippingAddress?: string | null;
    }
  ) {
    if (user.canBuy === false) {
      throw forbidden('Your account cannot complete buyer payments');
    }
    const checkoutCurrency = assertStripeCurrency(input.checkoutCurrency);
    const rows = await prisma.cartItem.findMany({
      where: { buyerId: user.id },
      include: { product: true },
      orderBy: { createdAt: 'asc' }
    });
    if (rows.length === 0) throw badRequest('Cart is empty');

    const rates = await getUsdQuoteRates();
    const bySeller = new Map<string, typeof rows>();
    for (const row of rows) {
      const product = row.product;
      if (product.status !== 'published') throw badRequest(`"${product.title}" is no longer available`);
      if (product.sellerId === user.id) throw forbidden('You cannot purchase your own listing');
      if (product.quantity < row.quantity) throw badRequest(`Not enough stock for "${product.title}"`);
      const sellerRows = bySeller.get(product.sellerId) ?? [];
      sellerRows.push(row);
      bySeller.set(product.sellerId, sellerRows);
    }

    const groups: CartSnapshotGroup[] = [];
    const params = new URLSearchParams({
      mode: 'payment',
      success_url: buildReturnUrl('/orders?payment=stripe-success'),
      cancel_url: buildReturnUrl('/cart/checkout?payment=stripe-cancelled'),
      'metadata[kind]': 'catalog_cart',
      'metadata[userId]': user.id
    });

    let lineIndex = 0;
    for (const [sellerId, sellerRows] of bySeller) {
      let subtotal = 0;
      const lines: CartSnapshotLine[] = [];
      for (const row of sellerRows) {
        const product = row.product;
        const unitPrice = roundCatalogMoney(
          convertUsdQuoted(Number(product.price), product.currency, checkoutCurrency, rates)
        );
        const lineTotal = roundCatalogMoney(unitPrice * row.quantity);
        subtotal = roundCatalogMoney(subtotal + lineTotal);
        lines.push({
          productId: product.id,
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          unitPrice,
          quantity: row.quantity
        });
        appendLineItem(params, lineIndex, {
          name: product.title,
          unitAmount: toStripeAmount(unitPrice, checkoutCurrency),
          currency: checkoutCurrency,
          quantity: row.quantity
        });
        lineIndex += 1;
      }
      groups.push({
        sellerId,
        subtotal,
        shippingAmount: 0,
        total: subtotal,
        lines
      });
    }

    const session = await createStripeCheckoutSession(params);
    await prisma.paymentSession.create({
      data: {
        userId: user.id,
        kind: 'catalog_cart',
        stripeSessionId: session.id,
        checkoutCurrency,
        status: 'pending',
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        cartSnapshot: groups as unknown as Prisma.InputJsonValue
      }
    });
    return { id: session.id, url: session.url };
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): unknown {
    if (!config.stripe.webhookSecret) {
      throw serviceUnavailable('Stripe webhook secret is not configured.');
    }
    if (!signatureHeader) {
      throw badRequest('Missing Stripe signature.');
    }
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => {
        const [key, value] = part.split('=');
        return [key, value];
      })
    );
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) {
      throw badRequest('Invalid Stripe signature header.');
    }
    const expected = crypto
      .createHmac('sha256', config.stripe.webhookSecret)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw badRequest('Invalid Stripe signature.');
    }
    return JSON.parse(rawBody.toString('utf8'));
  }

  async handleStripeEvent(event: unknown): Promise<void> {
    const e = event as { type?: string; data?: { object?: StripeCheckoutSession } };
    if (e.type !== 'checkout.session.completed') return;
    const session = e.data?.object;
    if (!session?.id) return;
    const payment = await prisma.paymentSession.findUnique({ where: { stripeSessionId: session.id } });
    if (payment == null || payment.status === 'completed') return;

    if (payment.kind === 'request_deal') {
      await this.fulfillRequestDeal(payment.id, session);
      return;
    }
    if (payment.kind === 'catalog_cart') {
      await this.fulfillCatalogCart(payment.id, session);
    }
  }

  private async fulfillRequestDeal(paymentSessionId: string, session: StripeCheckoutSession): Promise<void> {
    const payment = await prisma.paymentSession.findUnique({ where: { id: paymentSessionId } });
    if (payment == null || payment.conversationId == null) return;

    const conv = await prisma.conversation.findUnique({
      where: { id: payment.conversationId },
      include: { request: { select: { id: true, title: true, quantity: true } } }
    });
    if (conv == null || conv.agreedPrice == null || conv.agreedCurrency == null) return;

    const existing = await prisma.requestDealOrder.findUnique({ where: { conversationId: conv.id } });
    if (existing != null) {
      await prisma.paymentSession.update({
        where: { id: payment.id },
        data: { status: 'completed', stripePaymentIntentId: session.payment_intent ?? null }
      });
      return;
    }

    const agreedPrice = conv.agreedPrice;
    const agreedCurrency = conv.agreedCurrency;
    if (agreedPrice == null || agreedCurrency == null) return;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.requestDealOrder.create({
        data: {
          conversationId: conv.id,
          requestId: conv.requestId,
          buyerId: conv.buyerId,
          sellerId: conv.sellerId,
          title: conv.request.title,
          amount: agreedPrice,
          currency: agreedCurrency,
          status: CatalogOrderStatus.processing,
          paymentProvider: 'stripe',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent ?? null
        }
      });
      await tx.user.update({
        where: { id: conv.sellerId },
        data: { walletBalance: { increment: agreedPrice } }
      });
      await tx.paymentSession.update({
        where: { id: payment.id },
        data: { status: 'completed', stripePaymentIntentId: session.payment_intent ?? null }
      });
      return created;
    });

    await this.dealEvents.publishRequestDealPaid({
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      title: order.title,
      amount: Number(order.amount),
      currency: order.currency
    });
  }

  private async fulfillCatalogCart(paymentSessionId: string, session: StripeCheckoutSession): Promise<void> {
    const payment = await prisma.paymentSession.findUnique({ where: { id: paymentSessionId } });
    if (payment == null || payment.checkoutCurrency == null) return;
    const checkoutCurrency = payment.checkoutCurrency;
    const groups = payment.cartSnapshot as unknown as CartSnapshotGroup[] | null;
    if (!Array.isArray(groups) || groups.length === 0) return;

    try {
      const orderIds = await prisma.$transaction(async (tx) => {
        const ids: string[] = [];
        for (const group of groups) {
          const order = await tx.catalogOrder.create({
            data: {
              buyerId: payment.userId,
              sellerId: group.sellerId,
              status: CatalogOrderStatus.processing,
              paymentProvider: 'stripe',
              paymentStatus: 'paid',
              stripeSessionId: group === groups[0] ? session.id : null,
              stripePaymentIntentId: group === groups[0] ? session.payment_intent ?? null : null,
              currency: checkoutCurrency,
              subtotal: new Prisma.Decimal(group.subtotal),
              shippingAmount: new Prisma.Decimal(group.shippingAmount),
              total: new Prisma.Decimal(group.total),
              shippingName: payment.shippingName,
              shippingPhone: payment.shippingPhone,
              shippingAddress: payment.shippingAddress,
              lines: {
                create: group.lines.map((line) => ({
                  productId: line.productId,
                  productSlug: line.slug,
                  title: line.title,
                  imageUrl: line.imageUrl,
                  unitPrice: new Prisma.Decimal(line.unitPrice),
                  currency: checkoutCurrency,
                  quantity: line.quantity
                }))
              }
            },
            select: { id: true }
          });
          ids.push(order.id);
          for (const line of group.lines) {
            const updated = await tx.catalogProduct.updateMany({
              where: { id: line.productId, quantity: { gte: line.quantity }, status: 'published' },
              data: { quantity: { decrement: line.quantity } }
            });
            if (updated.count !== 1) throw new Error('INSUFFICIENT_STOCK');
          }
        }
        await tx.cartItem.deleteMany({ where: { buyerId: payment.userId } });
        await tx.paymentSession.update({
          where: { id: payment.id },
          data: { status: 'completed', stripePaymentIntentId: session.payment_intent ?? null }
        });
        return ids;
      });

      const orders = await prisma.catalogOrder.findMany({
        where: { id: { in: orderIds } },
        include: { lines: true }
      });
      for (const order of orders) {
        await this.shopEvents.publishOrderPlaced({
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          total: Number(order.total),
          currency: order.currency,
          firstLineTitle: order.lines[0]?.title
        });
      }
    } catch (error: unknown) {
      await prisma.paymentSession.update({
        where: { id: payment.id },
        data: { status: 'failed', lastError: error instanceof Error ? error.message : 'Payment fulfillment failed' }
      });
      throw error;
    }
  }
}

export default PaymentService;
