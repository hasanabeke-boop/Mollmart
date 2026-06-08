import { NotificationReferenceType, NotificationType } from '@prisma/client';

export interface NotificationListQuery {
  isRead?: boolean;
}

export interface NotificationRecordInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType: NotificationReferenceType;
  referenceId: string;
  dedupeKey?: string;
}

export interface EventEnvelope {
  channel: string;
  payload: unknown;
}

export interface MappedNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType: NotificationReferenceType;
  referenceId: string;
  dedupeKey?: string;
}
