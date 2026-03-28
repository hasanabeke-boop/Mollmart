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
