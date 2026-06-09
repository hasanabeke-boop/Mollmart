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
import { AdminDashboardSummary, ContentFlagUpsertInput, ModerationCaseListQuery } from '../types/admin';

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
  listModerationCases(query: ModerationCaseListQuery): Promise<ModerationCaseWithActions[]>;
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

  async listModerationCases(query: ModerationCaseListQuery): Promise<ModerationCaseWithActions[]> {
    return this.client.moderationCase.findMany({
      where: {
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.targetType !== undefined ? { targetType: query.targetType } : {})
      },
      include: moderationCaseInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });
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
      resolvedCases
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
        resolvedCases
      },
      categories: {
        total: totalCategories,
        active: activeCategories
      }
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

    return {
      items: items.map((row) => ({
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
        buyer: row.buyer
      })),
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
