import {
  ContentFlagStatus,
  ModerationCaseStatus,
  ModerationTargetType
} from '@prisma/client';

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CreateModerationCaseInput {
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
  assignedTo?: string;
}

export interface UpdateModerationCaseInput {
  status?: ModerationCaseStatus;
  assignedTo?: string;
  resolutionNote?: string;
  actionType?: 'hide_content' | 'unhide_content' | 'note';
}

export interface ModerationCaseListQuery {
  status?: ModerationCaseStatus;
  targetType?: ModerationTargetType;
  page?: number;
  limit?: number;
}

export interface SubmitContentReportInput {
  targetType: 'request' | 'catalog_product';
  targetId: string;
  reason: string;
}

export interface BlockUserInput {
  reason: string;
}

export interface AdminDashboardSummary {
  users: {
    blocked: number;
    flagged: number;
  };
  requests: {
    flagged: number;
    hidden: number;
  };
  offers: {
    flagged: number;
    hidden: number;
  };
  flags: {
    total: number;
    active: number;
  };
  moderation: {
    openCases: number;
    inReviewCases: number;
    resolvedCases: number;
    dismissedCases: number;
  };
  categories: {
    total: number;
    active: number;
  };
}

export interface AdminPlatformReport extends AdminDashboardSummary {
  platform: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    suspendedUsers: number;
    buyers: number;
    sellers: number;
    admins: number;
    totalRequests: number;
    publishedRequests: number;
    totalOffers: number;
    catalogProducts: number;
    publishedProducts: number;
    catalogOrders: number;
    requestDealOrders: number;
    openCatalogOrders: number;
    openRequestDealOrders: number;
    conversations: number;
    notifications: number;
  };
  recent: {
    usersLast7Days: number;
    requestsLast7Days: number;
    catalogOrdersLast7Days: number;
    requestDealOrdersLast7Days: number;
  };
  revenue: {
    completedCatalogOrders: number;
    completedRequestDealOrders: number;
  };
  checkedAt: string;
}

export interface ContentFlagUpsertInput {
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
  createdBy: string;
  status?: ContentFlagStatus;
  hiddenBy?: string | null;
  hiddenAt?: Date | null;
}
