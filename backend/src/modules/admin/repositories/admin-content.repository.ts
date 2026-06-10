import {
  CatalogOrderStatus,
  ModerationTargetType,
  Prisma,
  PrismaClient
} from '@prisma/client';
import prisma from '../../../config/prisma';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';
import { isContentHidden } from '../../../shared/contentFlags';
import type {
  AdminAuctionRow,
  AdminCatalogProductRow,
  AdminContentActionInput,
  AdminEntityTargetType,
  AdminListQuery,
  AdminOfferRow
} from '../types/admin';

export class AdminContentRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async hideContent(
    adminId: string,
    input: AdminContentActionInput
  ): Promise<{ targetType: AdminEntityTargetType; targetId: string; hidden: true }> {
    const reason = input.reason?.trim() || 'Hidden by administrator';

    if (input.targetType === 'user') {
      await this.client.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: input.targetId },
          data: { status: 'blocked' }
        });
        await tx.refreshToken.deleteMany({ where: { userId: input.targetId } });
        await tx.blockedUser.upsert({
          where: { userId: input.targetId },
          update: {
            reason,
            blockedBy: adminId,
            blockedAt: new Date(),
            unblockedAt: null
          },
          create: {
            userId: input.targetId,
            reason,
            blockedBy: adminId
          }
        });
      });
      await this.upsertFlag('user', input.targetId, reason, adminId, 'hidden', adminId);
      return { targetType: input.targetType, targetId: input.targetId, hidden: true };
    }

    if (input.targetType === 'category') {
      await this.client.category.update({
        where: { id: input.targetId },
        data: { isActive: false }
      });
      return { targetType: input.targetType, targetId: input.targetId, hidden: true };
    }

    if (input.targetType === 'auction') {
      await this.client.auctionSession.update({
        where: { id: input.targetId },
        data: { status: 'cancelled', endedAt: new Date() }
      });
      const session = await this.client.auctionSession.findUnique({
        where: { id: input.targetId },
        select: { requestId: true }
      });
      if (session != null) {
        await this.client.request.update({
          where: { id: session.requestId },
          data: { auctionEnabled: false }
        });
      }
      return { targetType: input.targetType, targetId: input.targetId, hidden: true };
    }

    await this.upsertFlag(input.targetType, input.targetId, reason, adminId, 'hidden', adminId);
    await this.applyVisibility(input.targetType, input.targetId, true);
    return { targetType: input.targetType, targetId: input.targetId, hidden: true };
  }

  async unhideContent(
    adminId: string,
    input: Pick<AdminContentActionInput, 'targetType' | 'targetId'>
  ): Promise<{ targetType: AdminEntityTargetType; targetId: string; hidden: false }> {
    void adminId;

    if (input.targetType === 'user') {
      await this.client.user.update({
        where: { id: input.targetId },
        data: { status: 'active' }
      });
      await this.upsertFlag('user', input.targetId, 'Unblocked by administrator', adminId, 'cleared', null);
      await this.client.blockedUser.updateMany({
        where: { userId: input.targetId, unblockedAt: null },
        data: { unblockedAt: new Date() }
      });
      return { targetType: input.targetType, targetId: input.targetId, hidden: false };
    }

    if (input.targetType === 'category') {
      await this.client.category.update({
        where: { id: input.targetId },
        data: { isActive: true }
      });
      return { targetType: input.targetType, targetId: input.targetId, hidden: false };
    }

    if (input.targetType === 'auction') {
      throw new Error('Auctions cannot be unhidden; create a new session from the request if needed');
    }

    await this.upsertFlag(input.targetType, input.targetId, 'Restored by administrator', adminId, 'cleared', null);
    await this.applyVisibility(input.targetType, input.targetId, false);
    return { targetType: input.targetType, targetId: input.targetId, hidden: false };
  }

  async deleteContent(input: Pick<AdminContentActionInput, 'targetType' | 'targetId'>): Promise<void> {
    await this.clearFlagsAndCases(input.targetType, input.targetId);

    switch (input.targetType) {
      case 'request':
        await this.deleteRequest(input.targetId);
        return;
      case 'catalog_product': {
        const lines = await this.client.catalogOrderLine.count({
          where: { productId: input.targetId }
        });
        if (lines > 0) {
          await this.client.catalogProduct.update({
            where: { id: input.targetId },
            data: { status: 'archived' }
          });
          return;
        }
        try {
          await this.client.catalogProduct.delete({ where: { id: input.targetId } });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2003' || error.code === 'P2014')
          ) {
            await this.client.catalogProduct.update({
              where: { id: input.targetId },
              data: { status: 'archived' }
            });
            return;
          }
          throw error;
        }
        return;
      }
      case 'offer':
        await this.client.offer.delete({ where: { id: input.targetId } });
        return;
      case 'user':
        throw new Error('User deletion must use DELETE /api/v1/auth/admin/users/:id');
      case 'category':
        await this.deleteCategory(input.targetId);
        return;
      case 'auction':
        await this.client.auctionSession.delete({ where: { id: input.targetId } });
        return;
      default:
        throw new Error('Unsupported target type');
    }
  }

  async listCatalogProducts(query: AdminListQuery) {
    const page = normalizePage(query.page ?? 1);
    const limit = normalizeLimit(query.limit ?? 20);
    const trimmed = query.q?.trim();
    const where: Prisma.CatalogProductWhereInput = {
      ...(query.status != null && query.status.length > 0 ? { status: query.status as never } : {}),
      ...(trimmed != null && trimmed.length > 0
        ? {
            OR: [
              { title: { contains: trimmed, mode: 'insensitive' } },
              { slug: { contains: trimmed, mode: 'insensitive' } },
              { id: trimmed },
              { seller: { email: { contains: trimmed, mode: 'insensitive' } } },
              { seller: { name: { contains: trimmed, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const [rows, total] = await Promise.all([
      this.client.catalogProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true, slug: true } }
        }
      }),
      this.client.catalogProduct.count({ where })
    ]);

    const items: AdminCatalogProductRow[] = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        price: Number(row.price),
        currency: row.currency,
        quantity: row.quantity,
        imageUrl: row.imageUrl,
        createdAt: row.createdAt.toISOString(),
        isHidden: await isContentHidden(this.client, 'catalog_product', row.id),
        seller: row.seller,
        category: row.category
      }))
    );

    return { items, meta: buildPageMeta(page, limit, total) };
  }

  async listOffers(query: AdminListQuery) {
    const page = normalizePage(query.page ?? 1);
    const limit = normalizeLimit(query.limit ?? 20);
    const trimmed = query.q?.trim();
    const where: Prisma.OfferWhereInput = {
      ...(query.status != null && query.status.length > 0 ? { status: query.status as never } : {}),
      ...(trimmed != null && trimmed.length > 0
        ? {
            OR: [
              { id: trimmed },
              { message: { contains: trimmed, mode: 'insensitive' } },
              { request: { title: { contains: trimmed, mode: 'insensitive' } } },
              { seller: { email: { contains: trimmed, mode: 'insensitive' } } },
              { seller: { name: { contains: trimmed, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const [rows, offerTotal] = await Promise.all([
      this.client.offer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          request: { select: { id: true, title: true } },
          seller: { select: { id: true, name: true, email: true } }
        }
      }),
      this.client.offer.count({ where })
    ]);

    const items: AdminOfferRow[] = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        requestId: row.requestId,
        requestTitle: row.request.title,
        price: Number(row.price),
        currency: row.currency,
        status: row.status,
        message: row.message,
        createdAt: row.createdAt.toISOString(),
        isHidden: await isContentHidden(this.client, 'offer', row.id),
        seller: row.seller
      }))
    );

    return { items, meta: buildPageMeta(page, limit, offerTotal) };
  }

  async listAuctions(query: AdminListQuery) {
    const page = normalizePage(query.page ?? 1);
    const limit = normalizeLimit(query.limit ?? 20);
    const trimmed = query.q?.trim();
    const where: Prisma.AuctionSessionWhereInput = {
      ...(query.status != null && query.status.length > 0 ? { status: query.status as never } : {}),
      ...(trimmed != null && trimmed.length > 0
        ? {
            OR: [
              { id: trimmed },
              { request: { title: { contains: trimmed, mode: 'insensitive' } } },
              { request: { buyer: { email: { contains: trimmed, mode: 'insensitive' } } } }
            ]
          }
        : {})
    };

    const [rows, total] = await Promise.all([
      this.client.auctionSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          request: {
            select: {
              id: true,
              title: true,
              currency: true,
              buyer: { select: { id: true, name: true, email: true } }
            }
          }
        }
      }),
      this.client.auctionSession.count({ where })
    ]);

    const items: AdminAuctionRow[] = rows.map((row) => ({
      id: row.id,
      requestId: row.requestId,
      requestTitle: row.request.title,
      status: row.status,
      participantCount: row.participantCount,
      currentRound: row.currentRound,
      leaderPrice: row.leaderPrice != null ? Number(row.leaderPrice) : null,
      currency: row.request.currency,
      createdAt: row.createdAt.toISOString(),
      buyer: row.request.buyer
    }));

    return { items, meta: buildPageMeta(page, limit, total) };
  }

  private async deleteRequest(requestId: string): Promise<void> {
    const offerIds = (
      await this.client.offer.findMany({
        where: { requestId },
        select: { id: true }
      })
    ).map((o) => o.id);

    await this.client.$transaction(async (tx) => {
      await tx.moderationCase.deleteMany({
        where: {
          OR: [
            { targetType: 'request', targetId: requestId },
            ...(offerIds.length > 0
              ? [{ targetType: 'offer' as const, targetId: { in: offerIds } }]
              : [])
          ]
        }
      });
      await tx.contentFlag.deleteMany({
        where: {
          OR: [
            { targetType: 'request', targetId: requestId },
            ...(offerIds.length > 0
              ? [{ targetType: 'offer' as const, targetId: { in: offerIds } }]
              : [])
          ]
        }
      });
      await tx.request.delete({ where: { id: requestId } });
    });
  }

  private async deleteCategory(categoryId: string): Promise<void> {
    const [children, products, requests] = await Promise.all([
      this.client.category.count({ where: { parentId: categoryId } }),
      this.client.catalogProduct.count({ where: { categoryId } }),
      this.client.request.count({ where: { categoryId } })
    ]);

    if (children > 0 || products > 0 || requests > 0) {
      await this.client.category.update({
        where: { id: categoryId },
        data: { isActive: false }
      });
      return;
    }

    await this.client.category.delete({ where: { id: categoryId } });
  }

  private async clearFlagsAndCases(
    targetType: AdminEntityTargetType,
    targetId: string
  ): Promise<void> {
    if (targetType === 'category' || targetType === 'auction') {
      return;
    }

    await this.client.$transaction([
      this.client.moderationCase.deleteMany({
        where: { targetType: targetType as ModerationTargetType, targetId }
      }),
      this.client.contentFlag.deleteMany({
        where: { targetType: targetType as ModerationTargetType, targetId }
      })
    ]);
  }

  private async upsertFlag(
    targetType: ModerationTargetType,
    targetId: string,
    reason: string,
    createdBy: string,
    status: 'hidden' | 'cleared' | 'active',
    hiddenBy: string | null
  ): Promise<void> {
    const existing = await this.client.contentFlag.findFirst({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' }
    });

    if (existing == null) {
      await this.client.contentFlag.create({
        data: {
          targetType,
          targetId,
          reason,
          createdBy,
          status,
          hiddenBy,
          hiddenAt: status === 'hidden' ? new Date() : null
        }
      });
      return;
    }

    await this.client.contentFlag.update({
      where: { id: existing.id },
      data: {
        reason,
        status,
        hiddenBy,
        hiddenAt: status === 'hidden' ? new Date() : null
      }
    });
  }

  private async applyVisibility(
    targetType: ModerationTargetType,
    targetId: string,
    hidden: boolean
  ): Promise<void> {
    if (targetType === 'request') {
      await this.client.request.update({
        where: { id: targetId },
        data: { status: hidden ? 'cancelled' : 'published' }
      });
      return;
    }

    if (targetType === 'catalog_product') {
      await this.client.catalogProduct.update({
        where: { id: targetId },
        data: { status: hidden ? 'archived' : 'published' }
      });
      return;
    }

    if (targetType === 'offer') {
      await this.client.offer.update({
        where: { id: targetId },
        data: {
          status: hidden ? 'withdrawn' : 'submitted',
          withdrawnAt: hidden ? new Date() : null
        }
      });
    }
  }
}

export default AdminContentRepository;
