import {
  BlockedUser,
  Category,
  ContentFlag,
  ContentFlagStatus,
  ModerationAction,
  ModerationActionType,
  ModerationCase,
  ModerationCaseStatus,
  ModerationTargetType,
  Prisma,
  PrismaClient
} from '@prisma/client';
import prisma from '../../../config/prisma';
import { sortCategoriesWithOtherLast } from '../../../shared/categorySort';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';
import {
  AdminDashboardSummary,
  AdminPlatformReport,
  ContentFlagUpsertInput,
  ModerationCaseListQuery,
  ModerationTargetDetails
} from '../types/admin';
import { resolveModerationTargets, targetKey } from '../lib/resolveModerationTarget';

const moderationCaseInclude = {
  actions: {
    orderBy: {
      createdAt: 'desc'
    }
  }
} satisfies Prisma.ModerationCaseInclude;

export type ModerationCaseWithActions = ModerationCase & {
  actions: ModerationAction[];
};

export type ModerationCaseEnriched = ModerationCaseWithActions & {
  target: ModerationTargetDetails;
};

export interface AdminRepositoryLike {
  createCategory(data: Pick<Category, 'name' | 'slug' | 'isActive'> & { parentId?: string }): Promise<Category>;
  listCategories(): Promise<Category[]>;
  updateCategory(id: string, data: Partial<Pick<Category, 'name' | 'slug' | 'isActive'>> & { parentId?: string | null }): Promise<Category>;
  createModerationCase(data: {
    targetType: ModerationTargetType;
    targetId: string;
    reason: string;
    createdBy: string;
    assignedTo?: string;
  }): Promise<ModerationCaseWithActions>;
  listModerationCases(query: ModerationCaseListQuery): Promise<{
    items: ModerationCaseEnriched[];
    meta: ReturnType<typeof buildPageMeta>;
  }>;
  findModerationCaseById(id: string): Promise<ModerationCaseWithActions | null>;
  updateModerationCase(
    id: string,
    data: {
      status?: ModerationCaseStatus;
      assignedTo?: string | null;
      resolutionNote?: string | null;
      resolvedAt?: Date | null;
    },
    action: {
      actionType: ModerationActionType;
      actorId: string;
      note?: string;
    }
  ): Promise<ModerationCaseWithActions>;
  upsertContentFlag(input: ContentFlagUpsertInput): Promise<ContentFlag>;
  findOpenModerationCaseByReporter(
    targetType: ModerationTargetType,
    targetId: string,
    createdBy: string
  ): Promise<ModerationCase | null>;
  findReportTarget(
    targetType: ModerationTargetType,
    targetId: string
  ): Promise<{ id: string; ownerId: string } | null>;
  applyContentVisibilityChange(
    targetType: ModerationTargetType,
    targetId: string,
    hidden: boolean
  ): Promise<void>;
  blockUser(userId: string, reason: string, blockedBy: string): Promise<BlockedUser>;
  unblockUser(userId: string): Promise<BlockedUser | null>;
  getDashboardSummary(): Promise<AdminDashboardSummary>;
  getPlatformReport(): Promise<AdminPlatformReport>;
  listRequestsForAdmin(page: number, limit: number, q?: string): Promise<{
    items: Array<{
      id: string;
      title: string;
      status: string;
      currency: string;
      quantity: number;
      offerCount: number;
      offersCount: number;
      dealOrdersCount: number;
      createdAt: string;
      publishedAt: string | null;
      categoryId: string;
      buyer: {
        id: string;
        name: string;
        email: string | null;
      };
    }>;
    meta: ReturnType<typeof buildPageMeta>;
  }>;
  deleteRequestById(requestId: string): Promise<boolean>;
}

export class AdminRepository implements AdminRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async createCategory(data: Pick<Category, 'name' | 'slug' | 'isActive'> & { parentId?: string }): Promise<Category> {
    return this.client.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {})
      }
    });
  }

  async listCategories(): Promise<Category[]> {
    const rows = await this.client.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
    });
    return sortCategoriesWithOtherLast(rows);
  }

  async updateCategory(
    id: string,
    data: Partial<Pick<Category, 'name' | 'slug' | 'isActive'>> & { parentId?: string | null }
  ): Promise<Category> {
    return this.client.category.update({
      where: { id },
      data
    });
  }

  async createModerationCase(data: {
    targetType: ModerationTargetType;
    targetId: string;
    reason: string;
    createdBy: string;
    assignedTo?: string;
  }): Promise<ModerationCaseWithActions> {
    return this.client.moderationCase.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        createdBy: data.createdBy,
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {}),
        actions: {
          create: {
            actionType: 'note',
            actorId: data.createdBy,
            note: 'Moderation case created'
          }
        }
      },
      include: moderationCaseInclude
    });
  }

  async listModerationCases(query: ModerationCaseListQuery): Promise<{
    items: ModerationCaseEnriched[];
    meta: ReturnType<typeof buildPageMeta>;
  }> {
    const page = normalizePage(query.page ?? 1);
    const limit = normalizeLimit(query.limit ?? 20);
    const where: Prisma.ModerationCaseWhereInput = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.targetType !== undefined ? { targetType: query.targetType } : {})
    };

    const [items, total] = await Promise.all([
      this.client.moderationCase.findMany({
        where,
        include: moderationCaseInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.client.moderationCase.count({ where })
    ]);

    const targets = await resolveModerationTargets(
      this.client,
      items.map((item) => ({ targetType: item.targetType, targetId: item.targetId }))
    );

    return {
      items: items.map((item) => ({
        ...item,
        target: targets[targetKey(item.targetType, item.targetId)] ?? {
          exists: false,
          label: 'Unknown target',
          subtitle: item.targetId
        }
      })),
      meta: buildPageMeta(page, limit, total)
    };
  }

  async findModerationCaseById(id: string): Promise<ModerationCaseWithActions | null> {
    return this.client.moderationCase.findUnique({
      where: { id },
      include: moderationCaseInclude
    });
  }

  async updateModerationCase(
    id: string,
    data: {
      status?: ModerationCaseStatus;
      assignedTo?: string | null;
      resolutionNote?: string | null;
      resolvedAt?: Date | null;
    },
    action: {
      actionType: ModerationActionType;
      actorId: string;
      note?: string;
    }
  ): Promise<ModerationCaseWithActions> {
    return this.client.$transaction(async (tx) => {
      await tx.moderationCase.update({
        where: { id },
        data
      });

      await tx.moderationAction.create({
        data: {
          moderationCaseId: id,
          actionType: action.actionType,
          actorId: action.actorId,
          ...(action.note !== undefined ? { note: action.note } : {})
        }
      });

      return tx.moderationCase.findUniqueOrThrow({
        where: { id },
        include: moderationCaseInclude
      });
    });
  }

  async upsertContentFlag(input: ContentFlagUpsertInput): Promise<ContentFlag> {
    const existing = await this.client.contentFlag.findFirst({
      where: {
        targetType: input.targetType,
        targetId: input.targetId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existing == null) {
      return this.client.contentFlag.create({
        data: {
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          createdBy: input.createdBy,
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.hiddenBy !== undefined ? { hiddenBy: input.hiddenBy } : {}),
          ...(input.hiddenAt !== undefined ? { hiddenAt: input.hiddenAt } : {})
        }
      });
    }

    return this.client.contentFlag.update({
      where: { id: existing.id },
      data: {
        reason: input.reason,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.hiddenBy !== undefined ? { hiddenBy: input.hiddenBy } : {}),
        ...(input.hiddenAt !== undefined ? { hiddenAt: input.hiddenAt } : {})
      }
    });
  }

  async findOpenModerationCaseByReporter(
    targetType: ModerationTargetType,
    targetId: string,
    createdBy: string
  ): Promise<ModerationCase | null> {
    return this.client.moderationCase.findFirst({
      where: {
        targetType,
        targetId,
        createdBy,
        status: { in: ['open', 'in_review'] }
      }
    });
  }

  async findReportTarget(
    targetType: ModerationTargetType,
    targetId: string
  ): Promise<{ id: string; ownerId: string } | null> {
    if (targetType === ModerationTargetType.request) {
      const row = await this.client.request.findUnique({
        where: { id: targetId },
        select: { id: true, buyerId: true, status: true }
      });
      if (row == null || row.status === 'draft' || row.status === 'cancelled') {
        return null;
      }
      return { id: row.id, ownerId: row.buyerId };
    }

    if (targetType === ModerationTargetType.catalog_product) {
      const row = await this.client.catalogProduct.findUnique({
        where: { id: targetId },
        select: { id: true, sellerId: true, status: true }
      });
      if (row == null || row.status === 'archived') {
        return null;
      }
      return { id: row.id, ownerId: row.sellerId };
    }

    if (targetType === ModerationTargetType.offer) {
      const row = await this.client.offer.findUnique({
        where: { id: targetId },
        select: { id: true, sellerId: true, status: true }
      });
      if (row == null || row.status === 'withdrawn') {
        return null;
      }
      return { id: row.id, ownerId: row.sellerId };
    }

    if (targetType === ModerationTargetType.user) {
      const row = await this.client.user.findUnique({
        where: { id: targetId },
        select: { id: true, status: true }
      });
      if (row == null || row.status === 'blocked') {
        return null;
      }
      return { id: row.id, ownerId: row.id };
    }

    return null;
  }

  async applyContentVisibilityChange(
    targetType: ModerationTargetType,
    targetId: string,
    hidden: boolean
  ): Promise<void> {
    if (targetType === ModerationTargetType.request) {
      await this.client.request
        .update({
          where: { id: targetId },
          data: { status: hidden ? 'cancelled' : 'published' }
        })
        .catch(() => undefined);
      return;
    }

    if (targetType === ModerationTargetType.catalog_product) {
      await this.client.catalogProduct
        .update({
          where: { id: targetId },
          data: { status: hidden ? 'archived' : 'published' }
        })
        .catch(() => undefined);
      return;
    }

    if (targetType === ModerationTargetType.offer) {
      await this.client.offer
        .update({
          where: { id: targetId },
          data: {
            status: hidden ? 'withdrawn' : 'submitted',
            withdrawnAt: hidden ? new Date() : null
          }
        })
        .catch(() => undefined);
      return;
    }

    if (targetType === ModerationTargetType.user) {
      await this.client.user
        .update({
          where: { id: targetId },
          data: { status: hidden ? 'blocked' : 'active' }
        })
        .catch(() => undefined);
      if (hidden) {
        await this.client.refreshToken.deleteMany({ where: { userId: targetId } }).catch(() => undefined);
      }
    }
  }

  async blockUser(userId: string, reason: string, blockedBy: string): Promise<BlockedUser> {
    return this.client.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: 'blocked' }
      });

      await tx.refreshToken.deleteMany({
        where: { userId }
      });

      return tx.blockedUser.upsert({
        where: { userId },
        update: {
          reason,
          blockedBy,
          blockedAt: new Date(),
          unblockedAt: null
        },
        create: {
          userId,
          reason,
          blockedBy
        }
      });
    });
  }

  async unblockUser(userId: string): Promise<BlockedUser | null> {
    return this.client.$transaction(async (tx) => {
      const existing = await tx.blockedUser.findUnique({
        where: { userId }
      });

      if (existing == null) {
        return null;
      }

      await tx.user.update({
        where: { id: userId },
        data: { status: 'active' }
      });

      return tx.blockedUser.update({
        where: { userId },
        data: {
          unblockedAt: new Date()
        }
      });
    });
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const [
      blockedUsers,
      activeCategories,
      totalCategories,
      totalFlags,
      activeFlags,
      flaggedRequests,
      hiddenRequests,
      flaggedOffers,
      hiddenOffers,
      flaggedUsers,
      openCases,
      inReviewCases,
      resolvedCases,
      dismissedCases
    ] = await Promise.all([
      this.client.blockedUser.count({
        where: {
          unblockedAt: null
        }
      }),
      this.client.category.count({
        where: {
          isActive: true
        }
      }),
      this.client.category.count(),
      this.client.contentFlag.count(),
      this.client.contentFlag.count({
        where: { status: 'active' }
      }),
      this.client.contentFlag.count({
        where: {
          targetType: 'request'
        }
      }),
      this.client.contentFlag.count({
        where: {
          targetType: 'request',
          status: 'hidden'
        }
      }),
      this.client.contentFlag.count({
        where: {
          targetType: 'offer'
        }
      }),
      this.client.contentFlag.count({
        where: {
          targetType: 'offer',
          status: 'hidden'
        }
      }),
      this.client.contentFlag.count({
        where: {
          targetType: 'user'
        }
      }),
      this.client.moderationCase.count({
        where: {
          status: 'open'
        }
      }),
      this.client.moderationCase.count({
        where: {
          status: 'in_review'
        }
      }),
      this.client.moderationCase.count({
        where: {
          status: 'resolved'
        }
      }),
      this.client.moderationCase.count({
        where: {
          status: 'dismissed'
        }
      })
    ]);

    return {
      users: {
        blocked: blockedUsers,
        flagged: flaggedUsers
      },
      requests: {
        flagged: flaggedRequests,
        hidden: hiddenRequests
      },
      offers: {
        flagged: flaggedOffers,
        hidden: hiddenOffers
      },
      flags: {
        total: totalFlags,
        active: activeFlags
      },
      moderation: {
        openCases,
        inReviewCases,
        resolvedCases,
        dismissedCases
      },
      categories: {
        total: totalCategories,
        active: activeCategories
      }
    };
  }

  async getPlatformReport(): Promise<AdminPlatformReport> {
    const summary = await this.getDashboardSummary();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const openOrderStatuses = ['paid', 'in_progress', 'awaiting_confirmation'] as const;

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      buyers,
      sellers,
      admins,
      totalRequests,
      publishedRequests,
      totalOffers,
      catalogProducts,
      publishedProducts,
      catalogOrders,
      requestDealOrders,
      openCatalogOrders,
      openRequestDealOrders,
      conversations,
      notifications,
      usersLast7Days,
      requestsLast7Days,
      catalogOrdersLast7Days,
      requestDealOrdersLast7Days,
      completedCatalogOrders,
      completedRequestDealOrders
    ] = await Promise.all([
      this.client.user.count(),
      this.client.user.count({ where: { status: 'active' } }),
      this.client.user.count({ where: { status: 'suspended' } }),
      this.client.user.count({ where: { role: 'buyer' } }),
      this.client.user.count({ where: { role: 'seller' } }),
      this.client.user.count({ where: { role: 'admin' } }),
      this.client.request.count(),
      this.client.request.count({ where: { status: 'published' } }),
      this.client.offer.count(),
      this.client.catalogProduct.count(),
      this.client.catalogProduct.count({ where: { status: 'published' } }),
      this.client.catalogOrder.count(),
      this.client.requestDealOrder.count(),
      this.client.catalogOrder.count({ where: { status: { in: [...openOrderStatuses] } } }),
      this.client.requestDealOrder.count({ where: { status: { in: [...openOrderStatuses] } } }),
      this.client.conversation.count(),
      this.client.notification.count(),
      this.client.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.client.request.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.client.catalogOrder.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.client.requestDealOrder.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.client.catalogOrder.count({ where: { status: 'completed' } }),
      this.client.requestDealOrder.count({ where: { status: 'completed' } })
    ]);

    return {
      ...summary,
      platform: {
        totalUsers,
        activeUsers,
        blockedUsers: summary.users.blocked,
        suspendedUsers,
        buyers,
        sellers,
        admins,
        totalRequests,
        publishedRequests,
        totalOffers,
        catalogProducts,
        publishedProducts,
        catalogOrders,
        requestDealOrders,
        openCatalogOrders,
        openRequestDealOrders,
        conversations,
        notifications
      },
      recent: {
        usersLast7Days,
        requestsLast7Days,
        catalogOrdersLast7Days,
        requestDealOrdersLast7Days
      },
      revenue: {
        completedCatalogOrders,
        completedRequestDealOrders
      },
      checkedAt: new Date().toISOString()
    };
  }

  async listRequestsForAdmin(page: number, limit: number, q?: string) {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.RequestWhereInput = {};
    const trimmed = q?.trim();
    if (trimmed != null && trimmed.length > 0) {
      where.OR = [
        { title: { contains: trimmed, mode: 'insensitive' } },
        { id: trimmed },
        { buyer: { email: { contains: trimmed, mode: 'insensitive' } } },
        { buyer: { name: { contains: trimmed, mode: 'insensitive' } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.client.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          _count: { select: { offers: true, dealOrders: true } }
        }
      }),
      this.client.request.count({ where })
    ]);

    const itemsWithHidden = await Promise.all(
      items.map(async (row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        currency: row.currency,
        quantity: row.quantity,
        offerCount: row.offerCount,
        offersCount: row._count.offers,
        dealOrdersCount: row._count.dealOrders,
        createdAt: row.createdAt.toISOString(),
        publishedAt: row.publishedAt?.toISOString() ?? null,
        categoryId: row.categoryId,
        isHidden:
          row.status === 'cancelled' ||
          (await this.client.contentFlag.findFirst({
            where: { targetType: 'request', targetId: row.id, status: 'hidden' },
            select: { id: true }
          })) != null,
        buyer: row.buyer
      }))
    );

    return {
      items: itemsWithHidden,
      meta: buildPageMeta(p, l, total)
    };
  }

  async deleteRequestById(requestId: string): Promise<boolean> {
    const existing = await this.client.request.findUnique({
      where: { id: requestId },
      select: { id: true }
    });
    if (existing == null) {
      return false;
    }

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

    return true;
  }
}

export default AdminRepository;
