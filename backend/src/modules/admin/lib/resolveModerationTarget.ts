import { ModerationTargetType, PrismaClient } from '@prisma/client';
import { isContentHidden } from '../../../shared/contentFlags';
import type { ModerationTargetDetails } from '../types/admin';

export function targetKey(targetType: ModerationTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

export async function resolveModerationTargets(
  client: PrismaClient,
  items: Array<{ targetType: ModerationTargetType; targetId: string }>
): Promise<Record<string, ModerationTargetDetails>> {
  const result: Record<string, ModerationTargetDetails> = {};
  if (items.length === 0) {
    return result;
  }

  const byType = new Map<ModerationTargetType, Set<string>>();
  for (const item of items) {
    const set = byType.get(item.targetType) ?? new Set<string>();
    set.add(item.targetId);
    byType.set(item.targetType, set);
  }

  const requestIds = [...(byType.get('request') ?? [])];
  if (requestIds.length > 0) {
    const rows = await client.request.findMany({
      where: { id: { in: requestIds } },
      select: {
        id: true,
        title: true,
        status: true,
        currency: true,
        budgetMin: true,
        budgetMax: true,
        quantity: true,
        offerCount: true,
        auctionEnabled: true,
        buyer: { select: { id: true, name: true, email: true } }
      }
    });
    for (const row of rows) {
      const hidden = await isContentHidden(client, 'request', row.id);
      result[targetKey('request', row.id)] = {
        exists: true,
        label: row.title,
        subtitle: `${row.offerCount} offers · qty ${row.quantity}`,
        status: row.status,
        isHidden: hidden,
        publicPath: '/browse-buyer-requests',
        owner: {
          id: row.buyer.id,
          name: row.buyer.name,
          email: row.buyer.email
        },
        extra: {
          currency: row.currency,
          budgetMin: row.budgetMin != null ? Number(row.budgetMin) : null,
          budgetMax: row.budgetMax != null ? Number(row.budgetMax) : null,
          auctionEnabled: row.auctionEnabled
        }
      };
    }
  }

  const productIds = [...(byType.get('catalog_product') ?? [])];
  if (productIds.length > 0) {
    const rows = await client.catalogProduct.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        currency: true,
        quantity: true,
        imageUrl: true,
        seller: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } }
      }
    });
    for (const row of rows) {
      const hidden = await isContentHidden(client, 'catalog_product', row.id);
      result[targetKey('catalog_product', row.id)] = {
        exists: true,
        label: row.title,
        subtitle: row.category.name,
        status: row.status,
        imageUrl: row.imageUrl,
        isHidden: hidden,
        publicPath: `/products/${row.slug}`,
        owner: {
          id: row.seller.id,
          name: row.seller.name,
          email: row.seller.email
        },
        extra: {
          price: Number(row.price),
          currency: row.currency,
          quantity: row.quantity,
          categorySlug: row.category.slug
        }
      };
    }
  }

  const offerIds = [...(byType.get('offer') ?? [])];
  if (offerIds.length > 0) {
    const rows = await client.offer.findMany({
      where: { id: { in: offerIds } },
      select: {
        id: true,
        price: true,
        currency: true,
        status: true,
        message: true,
        deliveryDays: true,
        request: { select: { id: true, title: true, status: true } },
        seller: { select: { id: true, name: true, email: true } }
      }
    });
    for (const row of rows) {
      const hidden = await isContentHidden(client, 'offer', row.id);
      result[targetKey('offer', row.id)] = {
        exists: true,
        label: `Offer on “${row.request.title}”`,
        subtitle: `${Number(row.price)} ${row.currency}`,
        status: row.status,
        isHidden: hidden,
        publicPath: '/browse-buyer-requests',
        owner: {
          id: row.seller.id,
          name: row.seller.name,
          email: row.seller.email
        },
        extra: {
          requestId: row.request.id,
          requestTitle: row.request.title,
          requestStatus: row.request.status,
          deliveryDays: row.deliveryDays,
          messagePreview: row.message.slice(0, 120)
        }
      };
    }
  }

  const userIds = [...(byType.get('user') ?? [])];
  if (userIds.length > 0) {
    const rows = await client.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });
    for (const row of rows) {
      const hidden = await isContentHidden(client, 'user', row.id);
      result[targetKey('user', row.id)] = {
        exists: true,
        label: row.name,
        subtitle: row.email,
        status: row.status,
        isHidden: hidden || row.status === 'blocked',
        owner: {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role
        },
        extra: {
          role: row.role
        }
      };
    }
  }

  for (const item of items) {
    const key = targetKey(item.targetType, item.targetId);
    if (result[key] == null) {
      result[key] = {
        exists: false,
        label: 'Deleted or not found',
        subtitle: item.targetId,
        status: null,
        isHidden: false
      };
    }
  }

  return result;
}
