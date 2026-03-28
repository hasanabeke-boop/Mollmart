import config from '../config/config';
import logger from '../middleware/logger';
import { EventEnvelope, MappedNotification } from '../types/notification';

export interface NotificationEventMapperLike {
  mapEvent(event: EventEnvelope): MappedNotification[];
}

type PlainObject = Record<string, unknown>;

function isObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export class NotificationEventMapper implements NotificationEventMapperLike {
  mapEvent(event: EventEnvelope): MappedNotification[] {
    if (!isObject(event.payload)) {
      logger.warn(`Skipping malformed event on ${event.channel}: payload is not an object`);
      return [];
    }

    switch (event.channel) {
      case 'request.published':
        return this.mapRequestPublished(event.payload);
      case 'offer.created':
        return this.mapOfferCreated(event.payload);
      case 'offer.accepted':
        return this.mapOfferAccepted(event.payload);
      case 'chat.message.created':
        return this.mapChatMessageCreated(event.payload);
      case 'user.blocked':
        return this.mapUserBlocked(event.payload);
      case 'moderation.case.created':
        return config.subscriptions.moderationEvents ? this.mapModerationCaseCreated(event.payload) : [];
      default:
        return [];
    }
  }

  private mapRequestPublished(payload: PlainObject): MappedNotification[] {
    const buyerId = asString(payload.buyerId);
    const requestId = asString(payload.requestId);

    if (buyerId == null || requestId == null) {
      logger.warn('Skipping request.published event due to missing buyerId or requestId');
      return [];
    }

    return [
      {
        userId: buyerId,
        type: 'request_published',
        title: 'Request published',
        body: 'Your request is now live on the marketplace.',
        referenceType: 'request',
        referenceId: requestId,
        dedupeKey: `request-published-${requestId}-${buyerId}`
      }
    ];
  }

  private mapOfferCreated(payload: PlainObject): MappedNotification[] {
    const buyerId = asString(payload.buyerId);
    const offerId = asString(payload.offerId);

    if (buyerId == null || offerId == null) {
      logger.warn('Skipping offer.created event due to missing buyerId or offerId');
      return [];
    }

    return [
      {
        userId: buyerId,
        type: 'offer_created',
        title: 'New offer received',
        body: 'A seller submitted a new offer for one of your requests.',
        referenceType: 'offer',
        referenceId: offerId,
        dedupeKey: `offer-created-${offerId}-${buyerId}`
      }
    ];
  }

  private mapOfferAccepted(payload: PlainObject): MappedNotification[] {
    const sellerId = asString(payload.sellerId);
    const offerId = asString(payload.offerId);

    if (sellerId == null || offerId == null) {
      logger.warn('Skipping offer.accepted event due to missing sellerId or offerId');
      return [];
    }

    return [
      {
        userId: sellerId,
        type: 'offer_accepted',
        title: 'Offer accepted',
        body: 'Your offer has been accepted by the buyer.',
        referenceType: 'offer',
        referenceId: offerId,
        dedupeKey: `offer-accepted-${offerId}-${sellerId}`
      }
    ];
  }

  private mapChatMessageCreated(payload: PlainObject): MappedNotification[] {
    const senderId = asString(payload.senderId);
    const conversationId = asString(payload.conversationId);
    const buyerId = asString(payload.buyerId);
    const sellerId = asString(payload.sellerId);

    if (senderId == null || conversationId == null) {
      logger.warn('Skipping chat.message.created event due to missing senderId or conversationId');
      return [];
    }

    const recipients = [buyerId, sellerId].filter((id): id is string => id != null && id !== senderId);
    if (recipients.length === 0) {
      logger.warn('Skipping chat.message.created event due to missing recipient ids');
      return [];
    }

    return recipients.map((recipientId) => ({
      userId: recipientId,
      type: 'chat_message_created',
      title: 'New message',
      body: 'You received a new marketplace chat message.',
      referenceType: 'conversation',
      referenceId: conversationId,
      dedupeKey: `chat-message-${asString(payload.messageId) ?? conversationId}-${recipientId}`
    }));
  }

  private mapUserBlocked(payload: PlainObject): MappedNotification[] {
    const userId = asString(payload.userId);

    if (userId == null) {
      logger.warn('Skipping user.blocked event due to missing userId');
      return [];
    }

    return [
      {
        userId,
        type: 'user_blocked',
        title: 'Account blocked',
        body: 'Your account has been blocked by platform administration.',
        referenceType: 'user',
        referenceId: userId,
        dedupeKey: `user-blocked-${userId}`
      }
    ];
  }

  private mapModerationCaseCreated(payload: PlainObject): MappedNotification[] {
    const caseId = asString(payload.id);
    const assignedTo = asString(payload.assignedTo);

    if (caseId == null || assignedTo == null) {
      return [];
    }

    return [
      {
        userId: assignedTo,
        type: 'moderation_case_created',
        title: 'Moderation case assigned',
        body: 'A new moderation case has been assigned to you.',
        referenceType: 'moderation_case',
        referenceId: caseId,
        dedupeKey: `moderation-case-${caseId}-${assignedTo}`
      }
    ];
  }
}

export default NotificationEventMapper;
