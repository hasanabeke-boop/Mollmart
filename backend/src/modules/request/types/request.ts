import { RequestStatus, RequestStatusHistoryAction } from '@prisma/client';

export interface RequestAttachmentInput {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  categoryId: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  location?: string;
  deadlineAt?: string;
  isNegotiable?: boolean;
  attachments?: RequestAttachmentInput[];
}

export interface UpdateRequestInput extends Partial<CreateRequestInput> {}

export interface RequestBoardQuery {
  categoryId?: string;
  /** When set, OR match on these category keys (slug and/or id). */
  categoryIdsIn?: string[];
  currency?: string;
  location?: string;
  q?: string;
  isNegotiable?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
  page: number;
  limit: number;
  sortBy: 'publishedAt' | 'createdAt' | 'deadlineAt' | 'budgetMin' | 'budgetMax';
  sortOrder: 'asc' | 'desc';
  /** From query string; parsed in service. */
  recommended?: boolean | string;
  /** Set by service: hide the viewer's own buyer requests from the seller board. */
  excludeBuyerId?: string;
}

export interface OwnerRequestQuery {
  status?: RequestStatus;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'deadlineAt';
  sortOrder: 'asc' | 'desc';
}

export interface StatusHistoryRecordInput {
  requestId: string;
  fromStatus?: RequestStatus;
  toStatus: RequestStatus;
  action: RequestStatusHistoryAction;
  actorId: string;
  note?: string;
}

export interface RequestListResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
