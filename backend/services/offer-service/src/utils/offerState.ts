import { OfferStatus, OfferStatusHistoryAction } from '@prisma/client';
import { badRequest } from './apiError';

const mutableStatuses: OfferStatus[] = ['submitted', 'updated'];
const activeStatuses: OfferStatus[] = ['submitted', 'updated'];

export function assertOfferEditable(status: OfferStatus): void {
  if (!mutableStatuses.includes(status)) {
    throw badRequest(`Offer cannot be edited while in "${status}" status`);
  }
}

export function assertOfferWithdrawable(status: OfferStatus): void {
  if (!mutableStatuses.includes(status)) {
    throw badRequest(`Offer cannot be withdrawn while in "${status}" status`);
  }
}

export function isActiveStatus(status: OfferStatus): boolean {
  return activeStatuses.includes(status);
}

export function getStatusAction(status: OfferStatus): OfferStatusHistoryAction {
  switch (status) {
    case 'updated':
      return 'updated';
    case 'withdrawn':
      return 'withdrawn';
    case 'accepted':
      return 'accepted';
    case 'rejected':
      return 'rejected';
    case 'expired':
      return 'expired';
    case 'submitted':
    default:
      return 'created';
  }
}
