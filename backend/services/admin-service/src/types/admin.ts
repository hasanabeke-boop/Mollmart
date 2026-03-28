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
  };
  categories: {
    total: number;
    active: number;
  };
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
