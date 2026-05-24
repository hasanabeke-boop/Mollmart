import { CatalogOrderStatus, CatalogProductStatus } from '@prisma/client';
import type { AuthUser } from '../../request/types/express';
import { badRequest, forbidden, notFound } from '../../request/utils/apiError';
import { convertUsdQuoted, getUsdQuoteRates, roundCatalogMoney } from '../../catalog/services/exchangeRates';
import ShopRepository, { type CartRow, type OrderRow } from '../repositories/shop.repository';
import ShopEventPublisher, { type ShopEventPublisherLike } from './shop-event.service';

const CHECKOUT_CURRENCIES = new Set(['USD', 'EUR', 'RUB', 'KZT']);

export type AddCartItemInput = { productId: string; quantity?: number };
export type CheckoutInput = {
  checkoutCurrency: string;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
};
export type AdminPatchOrderInput = {
  status?: CatalogOrderStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
};

export class ShopService {
  constructor(
    private readonly repo: ShopRepository,
    private readonly events: ShopEventPublisherLike = new ShopEventPublisher()
  ) {}

  async getCart(user: AuthUser) {
    this.assertBuyerCapability(user, 'view cart');
    const rows = await this.repo.findCartRows(user.id);
    return { items: rows.map((r: CartRow) => this.serializeCartRow(r)) };
  }

  async addToCart(user: AuthUser, input: AddCartItemInput) {
    this.assertBuyerCapability(user, 'add products to cart');
    const qty = input.quantity != null && input.quantity > 0 ? Math.floor(input.quantity) : 1;
    const product = await this.repo.findPublishedProduct(input.productId);
    if (product == null) {
      throw badRequest('Product is not available');
    }
    if (product.sellerId === user.id) {
      throw forbidden('You cannot add your own product to the cart');
    }
    if (product.quantity < 1) {
      throw badRequest('Product is out of stock');
    }

    const existing = await this.repo.findCartItem(user.id, input.productId);
    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > product.quantity) {
      throw badRequest(`Only ${product.quantity} units available`);
    }

    const row = await this.repo.upsertCartItem(user.id, input.productId, nextQty);
    return this.serializeCartRow(row);
  }

  async setCartQuantity(user: AuthUser, productId: string, quantity: number) {
    this.assertBuyerCapability(user, 'update cart');
    const q = Math.floor(quantity);
    if (q <= 0) {
      await this.repo.deleteCartItem(user.id, productId);
      return { removed: true as const };
    }

    const product = await this.repo.findPublishedProduct(productId);
    if (product == null) {
      throw badRequest('Product is not available');
    }
    if (product.sellerId === user.id) {
      throw forbidden('You cannot keep your own product in the cart');
    }
    if (q > product.quantity) {
      throw badRequest(`Only ${product.quantity} units available`);
    }

    const row = await this.repo.updateCartItemQuantity(user.id, productId, q);
    if (row == null) {
      throw notFound('Cart item not found');
    }
    return this.serializeCartRow(row);
  }

  async removeFromCart(user: AuthUser, productId: string) {
    this.assertBuyerCapability(user, 'update cart');
    await this.repo.deleteCartItem(user.id, productId);
    return { ok: true as const };
  }

  async checkout(user: AuthUser, input: CheckoutInput) {
    this.assertBuyerCapability(user, 'checkout');
    const checkoutCurrency = input.checkoutCurrency.trim().toUpperCase();
    if (!CHECKOUT_CURRENCIES.has(checkoutCurrency)) {
      throw badRequest('Invalid checkout currency');
    }

    const cart = await this.repo.findCartRows(user.id);
    if (cart.length === 0) {
      throw badRequest('Cart is empty');
    }

    const rates = await getUsdQuoteRates();

    const bySeller = new Map<string, CartRow[]>();
    for (const row of cart) {
      const p = row.product;
      if (p.status !== CatalogProductStatus.published) {
        throw badRequest(`"${p.title}" is no longer available`);
      }
      if (p.sellerId === user.id) {
        throw forbidden('You cannot purchase your own listing');
      }
      if (p.quantity < row.quantity) {
        throw badRequest(`Not enough stock for "${p.title}"`);
      }
      const list = bySeller.get(p.sellerId) ?? [];
      list.push(row);
      bySeller.set(p.sellerId, list);
    }

    const groups: Array<{
      sellerId: string;
      subtotal: number;
      shippingAmount: number;
      total: number;
      lines: Array<{
        productId: string;
        slug: string;
        title: string;
        imageUrl: string;
        unitPrice: number;
        quantity: number;
      }>;
    }> = [];

    for (const [sellerId, rows] of bySeller) {
      let subtotal = 0;
      const lines: Array<{
        productId: string;
        slug: string;
        title: string;
        imageUrl: string;
        unitPrice: number;
        quantity: number;
      }> = [];

      for (const row of rows) {
        const p = row.product;
        const unit = roundCatalogMoney(
          convertUsdQuoted(Number(p.price), p.currency, checkoutCurrency, rates)
        );
        const lineSum = roundCatalogMoney(unit * row.quantity);
        subtotal = roundCatalogMoney(subtotal + lineSum);
        lines.push({
          productId: p.id,
          slug: p.slug,
          title: p.title,
          imageUrl: p.imageUrl,
          unitPrice: unit,
          quantity: row.quantity
        });
      }

      const shippingAmount = 0;
      groups.push({
        sellerId,
        lines,
        subtotal,
        shippingAmount,
        total: roundCatalogMoney(subtotal + shippingAmount)
      });
    }

    try {
      const orderIds = await this.repo.checkoutTransaction(user.id, checkoutCurrency, {
        name: input.shippingName,
        phone: input.shippingPhone,
        address: input.shippingAddress
      }, groups);

      const orders: OrderRow[] = [];
      for (const id of orderIds) {
        const o = await this.repo.getOrderById(id);
        if (o != null) {
          orders.push(o);
        }
      }

      for (const o of orders) {
        const firstTitle = o.lines[0]?.title;
        await this.events.publishOrderPlaced({
          orderId: o.id,
          buyerId: o.buyerId,
          sellerId: o.sellerId,
          total: Number(o.total),
          currency: o.currency,
          ...(firstTitle !== undefined ? { firstLineTitle: firstTitle } : {})
        });
      }

      return { orders: orders.map((o) => this.serializeOrder(o)) };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'INSUFFICIENT_STOCK') {
        throw badRequest('Stock changed while checking out. Please refresh your cart and try again.');
      }
      throw e;
    }
  }

  async listMyOrders(user: AuthUser, page: number, limit: number, status?: string) {
    const st = this.parseOrderStatus(status);
    if (user.role === 'seller') {
      const result = await this.repo.listOrdersForSeller(user.id, page, limit, st);
      return {
        items: result.items.map((o: OrderRow) => this.serializeOrder(o)),
        meta: result.meta
      };
    }
    const result = await this.repo.listOrdersForBuyer(user.id, page, limit, st);
    return {
      items: result.items.map((o: OrderRow) => this.serializeOrder(o)),
      meta: result.meta
    };
  }

  async getMyOrder(user: AuthUser, orderId: string) {
    const row =
      user.role === 'seller'
        ? await this.repo.getOrderForSeller(orderId, user.id)
        : await this.repo.getOrderForBuyer(orderId, user.id);
    if (row == null) {
      throw notFound('Order not found');
    }
    return this.serializeOrder(row);
  }

  async listOrdersAdmin(page: number, limit: number, status?: string) {
    const st = this.parseOrderStatus(status);
    const result = await this.repo.listOrdersAdmin(page, limit, st);
    return {
      items: result.items.map((o: OrderRow) => this.serializeOrder(o)),
      meta: result.meta
    };
  }

  async patchOrderAdmin(_admin: AuthUser, orderId: string, input: AdminPatchOrderInput) {
    const current = await this.repo.getOrderById(orderId);
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
      data.status = input.status;
    }
    if (input.trackingNumber !== undefined) {
      data.trackingNumber = input.trackingNumber;
    }
    if (input.carrier !== undefined) {
      data.carrier = input.carrier;
    }

    if (Object.keys(data).length === 0) {
      throw badRequest('No changes');
    }

    const updated = await this.repo.updateOrder(orderId, data);
    if (updated == null) {
      throw notFound('Order not found');
    }

    if (input.status !== undefined && updated.status !== previousStatus) {
      await this.events.publishOrderStatusChanged({
        orderId: updated.id,
        buyerId: updated.buyerId,
        sellerId: updated.sellerId,
        previousStatus,
        newStatus: updated.status
      });
    }

    return this.serializeOrder(updated);
  }

  async deleteOrderAdmin(_admin: AuthUser, orderId: string): Promise<void> {
    const deleted = await this.repo.deleteOrderById(orderId);
    if (!deleted) {
      throw notFound('Order not found');
    }
  }

  private parseOrderStatus(status?: string): CatalogOrderStatus | undefined {
    if (status == null || status.trim().length === 0) {
      return undefined;
    }
    const s = status.trim() as CatalogOrderStatus;
    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(s)) {
      return undefined;
    }
    return s;
  }

  private assertBuyerCapability(user: AuthUser, action: string): void {
    if (user.role !== 'buyer' || user.canBuy === false) {
      throw forbidden(`Buyer mode is required to ${action}`);
    }
  }

  private serializeCartRow(row: CartRow) {
    const p = row.product;
    return {
      productId: p.id,
      quantity: row.quantity,
      title: p.title,
      slug: p.slug,
      imageUrl: p.imageUrl,
      unitPrice: Number(p.price),
      currency: p.currency,
      maxQuantity: p.quantity,
      sellerId: p.sellerId,
      sellerName: p.seller.name
    };
  }

  private serializeOrder(row: OrderRow) {
    return {
      id: row.id,
      buyerId: row.buyerId,
      sellerId: row.sellerId,
      status: row.status,
      currency: row.currency,
      subtotal: Number(row.subtotal),
      shippingAmount: Number(row.shippingAmount),
      total: Number(row.total),
      shippingName: row.shippingName,
      shippingPhone: row.shippingPhone,
      shippingAddress: row.shippingAddress,
      trackingNumber: row.trackingNumber,
      carrier: row.carrier,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      seller: row.seller,
      buyer: row.buyer,
      lines: row.lines.map((l) => ({
        id: l.id,
        productId: l.productId,
        productSlug: l.productSlug,
        title: l.title,
        imageUrl: l.imageUrl,
        unitPrice: Number(l.unitPrice),
        currency: l.currency,
        quantity: l.quantity
      }))
    };
  }
}

export default ShopService;
