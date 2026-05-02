import { OfferStatus, OfferStatusHistoryAction } from '@prisma/client';

export interface CreateOfferInput {
  requestId: string;
  price: number;
  currency: string;
  message: string;
  deliveryDays?: number;
  warrantyInfo?: string;
}

export interface UpdateOfferInput extends Partial<Omit<CreateOfferInput, 'requestId'>> {}

export interface OfferListQuery {
  requestId?: string;
  status?: OfferStatus;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'price';
  sortOrder: 'asc' | 'desc';
}

export interface OfferRequestListQuery {
  requestId: string;
  status?: OfferStatus;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'price';
  sortOrder: 'asc' | 'desc';
}

export interface StatusHistoryRecordInput {
  offerId: string;
  fromStatus?: OfferStatus;
  toStatus: OfferStatus;
  action: OfferStatusHistoryAction;
  actorId: string;
  note?: string;
}

export interface RequestSummary {
  id: string;
  buyerId: string;
  status: string;
  deadlineAt: string | null;
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
