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
  blockUser(userId: string, reason: string, blockedBy: string): Promise<BlockedUser>;
  unblockUser(userId: string): Promise<BlockedUser | null>;
  getDashboardSummary(): Promise<AdminDashboardSummary>;
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
    return this.client.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
    });
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

  async blockUser(userId: string, reason: string, blockedBy: string): Promise<BlockedUser> {
    return this.client.blockedUser.upsert({
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
  }

  async unblockUser(userId: string): Promise<BlockedUser | null> {
    const existing = await this.client.blockedUser.findUnique({
      where: { userId }
    });

    if (existing == null) {
      return null;
    }

    return this.client.blockedUser.update({
      where: { userId },
      data: {
        unblockedAt: new Date()
      }
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
}

export default AdminRepository;
