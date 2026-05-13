import { CatalogOrderStatus, CatalogProductStatus, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../config/prisma';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';

const productForCart = {
  id: true,
  sellerId: true,
  title: true,
  slug: true,
  price: true,
  currency: true,
  imageUrl: true,
  quantity: true,
  status: true,
  seller: { select: { name: true } }
} satisfies Prisma.CatalogProductSelect;

export type CartRow = Prisma.CartItemGetPayload<{
  include: { product: { select: typeof productForCart } };
}>;

export type OrderLineRow = Prisma.CatalogOrderLineGetPayload<{
  include: { product: { select: { id: true; slug: true } } };
}>;

export type OrderRow = Prisma.CatalogOrderGetPayload<{
  include: {
    lines: true;
    seller: { select: { id: true; name: true } };
    buyer: { select: { id: true; name: true } };
  };
}>;

export class ShopRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findPublishedProduct(id: string) {
    return this.client.catalogProduct.findFirst({
      where: { id, status: CatalogProductStatus.published },
      select: productForCart
    });
  }

  async findCartRows(buyerId: string): Promise<CartRow[]> {
    return this.client.cartItem.findMany({
      where: { buyerId },
      include: { product: { select: productForCart } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findCartItem(buyerId: string, productId: string) {
    return this.client.cartItem.findUnique({
      where: { buyerId_productId: { buyerId, productId } }
    });
  }

  async upsertCartItem(buyerId: string, productId: string, quantity: number): Promise<CartRow> {
    return this.client.cartItem.upsert({
      where: { buyerId_productId: { buyerId, productId } },
      create: { buyerId, productId, quantity },
      update: { quantity },
      include: { product: { select: productForCart } }
    });
  }

  async updateCartItemQuantity(buyerId: string, productId: string, quantity: number): Promise<CartRow | null> {
    try {
      return await this.client.cartItem.update({
        where: { buyerId_productId: { buyerId, productId } },
        data: { quantity },
        include: { product: { select: productForCart } }
      });
    } catch {
      return null;
    }
  }

  async deleteCartItem(buyerId: string, productId: string): Promise<boolean> {
    try {
      await this.client.cartItem.delete({
        where: { buyerId_productId: { buyerId, productId } }
      });
      return true;
    } catch {
      return false;
    }
  }

  async clearCartForBuyer(buyerId: string, productIds: string[]) {
    if (productIds.length === 0) {
      return;
    }
    await this.client.cartItem.deleteMany({
      where: { buyerId, productId: { in: productIds } }
    });
  }

  async listOrdersForBuyer(buyerId: string, page: number, limit: number, status?: CatalogOrderStatus) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.CatalogOrderWhereInput = {
      buyerId,
      ...(status != null ? { status } : {})
    };
    const [items, total] = await Promise.all([
      this.client.catalogOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          lines: true,
          seller: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } }
        }
      }),
      this.client.catalogOrder.count({ where })
    ]);
    return { items, meta: buildPageMeta(p, l, total) };
  }

  async getOrderForBuyer(orderId: string, buyerId: string): Promise<OrderRow | null> {
    return this.client.catalogOrder.findFirst({
      where: { id: orderId, buyerId },
      include: {
        lines: true,
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } }
      }
    });
  }

  async listOrdersAdmin(page: number, limit: number, status?: CatalogOrderStatus) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.CatalogOrderWhereInput = status != null ? { status } : {};
    const [items, total] = await Promise.all([
      this.client.catalogOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          lines: true,
          seller: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } }
        }
      }),
      this.client.catalogOrder.count({ where })
    ]);
    return { items, meta: buildPageMeta(p, l, total) };
  }

  async getOrderById(orderId: string): Promise<OrderRow | null> {
    return this.client.catalogOrder.findUnique({
      where: { id: orderId },
      include: {
        lines: true,
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } }
      }
    });
  }

  async updateOrder(
    orderId: string,
    data: Prisma.CatalogOrderUpdateInput
  ): Promise<OrderRow | null> {
    try {
      return await this.client.catalogOrder.update({
        where: { id: orderId },
        data,
        include: {
          lines: true,
          seller: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } }
        }
      });
    } catch {
      return null;
    }
  }

  async checkoutTransaction(
    buyerId: string,
    checkoutCurrency: string,
    shipping: { name?: string | null; phone?: string | null; address?: string | null },
    groups: Array<{
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
    }>
  ): Promise<string[]> {
    return this.client.$transaction(async (tx) => {
      const orderIds: string[] = [];
      for (const g of groups) {
        const order = await tx.catalogOrder.create({
          data: {
            buyerId,
            sellerId: g.sellerId,
            status: CatalogOrderStatus.processing,
            currency: checkoutCurrency,
            subtotal: new Prisma.Decimal(g.subtotal),
            shippingAmount: new Prisma.Decimal(g.shippingAmount),
            total: new Prisma.Decimal(g.total),
            shippingName: shipping.name ?? null,
            shippingPhone: shipping.phone ?? null,
            shippingAddress: shipping.address ?? null,
            lines: {
              create: g.lines.map((l) => ({
                productId: l.productId,
                productSlug: l.slug,
                title: l.title,
                imageUrl: l.imageUrl,
                unitPrice: new Prisma.Decimal(l.unitPrice),
                currency: checkoutCurrency,
                quantity: l.quantity
              }))
            }
          },
          select: { id: true }
        });
        orderIds.push(order.id);
        for (const l of g.lines) {
          const updated = await tx.catalogProduct.updateMany({
            where: {
              id: l.productId,
              quantity: { gte: l.quantity },
              status: CatalogProductStatus.published
            },
            data: { quantity: { decrement: l.quantity } }
          });
          if (updated.count !== 1) {
            throw new Error('INSUFFICIENT_STOCK');
          }
        }
      }
      await tx.cartItem.deleteMany({ where: { buyerId } });
      return orderIds;
    });
  }
}

export default ShopRepository;
