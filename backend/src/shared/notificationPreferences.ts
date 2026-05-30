import type { NotificationType } from '@prisma/client';

export type NotificationPreferences = {
  requestUpdates: boolean;
  offerReplies: boolean;
  newsletter: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  requestUpdates: true,
  offerReplies: true,
  newsletter: true
};

const REQUEST_UPDATE_TYPES = new Set<NotificationType>([
  'request_published',
  'request_deal_paid',
  'request_deal_status_changed',
  'shop_order_placed',
  'shop_order_status_changed'
]);

const OFFER_REPLY_TYPES = new Set<NotificationType>([
  'offer_created',
  'offer_updated',
  'offer_withdrawn',
  'offer_accepted',
  'offer_rejected',
  'chat_message_created'
]);

const ALWAYS_DELIVER_TYPES = new Set<NotificationType>(['user_blocked', 'moderation_case_created']);

export function parseNotificationPreferences(raw: unknown): NotificationPreferences {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const record = raw as Record<string, unknown>;
  return {
    requestUpdates: record.requestUpdates !== false,
    offerReplies: record.offerReplies !== false,
    newsletter: record.newsletter !== false
  };
}

export function isNotificationAllowed(
  type: NotificationType,
  prefs: NotificationPreferences
): boolean {
  if (ALWAYS_DELIVER_TYPES.has(type)) {
    return true;
  }
  if (REQUEST_UPDATE_TYPES.has(type)) {
    return prefs.requestUpdates;
  }
  if (OFFER_REPLY_TYPES.has(type)) {
    return prefs.offerReplies;
  }
  return true;
}

export function shouldSendNotificationEmail(
  type: NotificationType,
  prefs: NotificationPreferences
): boolean {
  if (!isNotificationAllowed(type, prefs)) {
    return false;
  }
  return prefs.newsletter;
}
