import { RequestStatus, RequestStatusHistoryAction } from '@prisma/client';
import { badRequest } from './apiError';

const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  draft: ['published', 'cancelled'],
  published: ['has_offers', 'closed', 'cancelled'],
  has_offers: ['in_negotiation', 'accepted', 'closed', 'cancelled'],
  in_negotiation: ['accepted', 'closed', 'cancelled'],
  accepted: ['closed'],
  closed: [],
  cancelled: []
};

const statusActionMap: Record<RequestStatus, RequestStatusHistoryAction> = {
  draft: 'created',
  published: 'published',
  has_offers: 'moved_to_has_offers',
  in_negotiation: 'moved_to_negotiation',
  accepted: 'accepted',
  closed: 'closed',
  cancelled: 'cancelled'
};

const immutableStatuses: RequestStatus[] = ['accepted', 'closed', 'cancelled'];

type UpdateableRequestFields = {
  title?: string;
  description?: string;
  categoryId?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  location?: string;
  deadlineAt?: string;
  isNegotiable?: boolean;
  attachments?: unknown;
};

const limitedEditableFieldsAfterOffers = new Set<keyof UpdateableRequestFields>([
  'deadlineAt',
  'location',
  'isNegotiable'
]);

export function ensureTransitionAllowed(fromStatus: RequestStatus, toStatus: RequestStatus): void {
  const transitions = allowedTransitions[fromStatus];

  if (transitions == null || !transitions.includes(toStatus)) {
    throw badRequest(`Invalid request status transition from "${fromStatus}" to "${toStatus}"`);
  }
}

export function getHistoryActionForStatus(status: RequestStatus): RequestStatusHistoryAction {
  const action = statusActionMap[status];

  if (action == null) {
    throw badRequest(`No history action configured for request status "${status}"`);
  }

  return action;
}

export function assertRequestEditable(status: RequestStatus): void {
  if (immutableStatuses.includes(status)) {
    throw badRequest(`Request cannot be edited while in "${status}" status`);
  }
}

export function assertPublishedRequestUpdateAllowed(
  update: UpdateableRequestFields,
  hasOffers: boolean
): void {
  if (!hasOffers) {
    return;
  }

  const changedFields = Object.keys(update) as Array<keyof UpdateableRequestFields>;
  const invalidFields = changedFields.filter((field) => !limitedEditableFieldsAfterOffers.has(field));

  if (invalidFields.length > 0) {
    throw badRequest(
      `Published requests with offers can only update: ${Array.from(limitedEditableFieldsAfterOffers).join(', ')}`
    );
  }
}
