import { CatalogOrderStatus } from '@prisma/client';
import { badRequest, forbidden } from '../modules/offer/utils/apiError';

export const CATALOG_ORDER_STATUS_VALUES: CatalogOrderStatus[] = [
  CatalogOrderStatus.paid,
  CatalogOrderStatus.in_progress,
  CatalogOrderStatus.awaiting_confirmation,
  CatalogOrderStatus.completed,
  CatalogOrderStatus.cancelled
];

export type OrderActor = 'buyer' | 'seller' | 'admin';

export function parseCatalogOrderStatus(status?: string): CatalogOrderStatus | undefined {
  if (status == null || status.trim().length === 0) {
    return undefined;
  }
  const s = status.trim() as CatalogOrderStatus;
  if (!CATALOG_ORDER_STATUS_VALUES.includes(s)) {
    return undefined;
  }
  return s;
}

export function isTerminalOrderStatus(status: CatalogOrderStatus): boolean {
  return status === CatalogOrderStatus.completed || status === CatalogOrderStatus.cancelled;
}

export function assertOrderStatusTransition(
  actor: OrderActor,
  from: CatalogOrderStatus,
  to: CatalogOrderStatus
): void {
  if (from === to) {
    throw badRequest('Status is already set');
  }
  if (isTerminalOrderStatus(from)) {
    throw badRequest('Order is closed');
  }

  if (to === CatalogOrderStatus.cancelled) {
    if (actor !== 'admin') {
      throw forbidden('Only an admin can cancel an order');
    }
    return;
  }

  if (to === CatalogOrderStatus.paid) {
    throw forbidden('Paid status is set automatically when the order is created');
  }

  if (to === CatalogOrderStatus.in_progress) {
    if (actor !== 'seller' || from !== CatalogOrderStatus.paid) {
      throw forbidden('Only the seller can start work on a paid order');
    }
    return;
  }

  if (to === CatalogOrderStatus.awaiting_confirmation) {
    if (actor !== 'seller' || from !== CatalogOrderStatus.in_progress) {
      throw forbidden('Only the seller can mark an order as awaiting buyer confirmation');
    }
    return;
  }

  if (to === CatalogOrderStatus.completed) {
    if (actor !== 'buyer' || from !== CatalogOrderStatus.awaiting_confirmation) {
      throw forbidden('Only the buyer can confirm completion after delivery or service');
    }
    return;
  }

  throw badRequest('Invalid status transition');
}

export function resolveOrderActor(
  user: { id: string; role: string },
  order: { buyerId: string; sellerId: string }
): OrderActor | null {
  if (user.role === 'admin') {
    return 'admin';
  }
  if (user.id === order.sellerId) {
    return 'seller';
  }
  if (user.id === order.buyerId) {
    return 'buyer';
  }
  return null;
}
