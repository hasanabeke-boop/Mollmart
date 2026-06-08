import config from '../../../config/config';
import logger from '../../../middleware/logger';
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

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
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
      case 'offer.updated':
        return this.mapOfferUpdated(event.payload);
      case 'offer.withdrawn':
        return this.mapOfferWithdrawn(event.payload);
      case 'offer.accepted':
        return this.mapOfferAccepted(event.payload);
      case 'offer.rejected':
        return this.mapOfferRejected(event.payload);
      case 'chat.message.created':
        return this.mapChatMessageCreated(event.payload);
      case 'user.blocked':
        return this.mapUserBlocked(event.payload);
      case 'shop.order.placed':
        return this.mapShopOrderPlaced(event.payload);
      case 'shop.order.status_changed':
        return this.mapShopOrderStatusChanged(event.payload);
      case 'request_deal.paid':
        return this.mapRequestDealPaid(event.payload);
      case 'request_deal.status_changed':
        return this.mapRequestDealStatusChanged(event.payload);
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
        body: 'Your request is now live and visible to matching sellers.',
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

  private mapOfferUpdated(payload: PlainObject): MappedNotification[] {
    const buyerId = asString(payload.buyerId);
    const offerId = asString(payload.offerId);

    if (buyerId == null || offerId == null) {
      logger.warn('Skipping offer.updated event due to missing buyerId or offerId');
      return [];
    }

    return [
      {
        userId: buyerId,
        type: 'offer_updated',
        title: 'Offer updated',
        body: 'A seller updated an offer for one of your requests.',
        referenceType: 'offer',
        referenceId: offerId,
        dedupeKey: `offer-updated-${offerId}-${asString(payload.updatedAt) ?? 'latest'}-${buyerId}`
      }
    ];
  }

  private mapOfferWithdrawn(payload: PlainObject): MappedNotification[] {
    const buyerId = asString(payload.buyerId);
    const offerId = asString(payload.offerId);

    if (buyerId == null || offerId == null) {
      logger.warn('Skipping offer.withdrawn event due to missing buyerId or offerId');
      return [];
    }

    return [
      {
        userId: buyerId,
        type: 'offer_withdrawn',
        title: 'Offer withdrawn',
        body: 'A seller withdrew an offer from one of your requests.',
        referenceType: 'offer',
        referenceId: offerId,
        dedupeKey: `offer-withdrawn-${offerId}-${buyerId}`
      }
    ];
  }

  private mapOfferRejected(payload: PlainObject): MappedNotification[] {
    const sellerId = asString(payload.sellerId);
    const offerId = asString(payload.offerId);

    if (sellerId == null || offerId == null) {
      logger.warn('Skipping offer.rejected event due to missing sellerId or offerId');
      return [];
    }

    return [
      {
        userId: sellerId,
        type: 'offer_rejected',
        title: 'Offer not selected',
        body: 'The buyer selected another offer for this request.',
        referenceType: 'offer',
        referenceId: offerId,
        dedupeKey: `offer-rejected-${offerId}-${sellerId}`
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
      body: 'You received a new chat message from a matched user.',
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

  private mapShopOrderPlaced(payload: PlainObject): MappedNotification[] {
    const orderId = asString(payload.orderId);
    const buyerId = asString(payload.buyerId);
    const sellerId = asString(payload.sellerId);
    const currency = asString(payload.currency) ?? '';
    const total = asNumber(payload.total);
    const firstLineTitle = asString(payload.firstLineTitle);

    if (orderId == null || buyerId == null || sellerId == null) {
      logger.warn('Skipping shop.order.placed event due to missing orderId, buyerId, or sellerId');
      return [];
    }

    const totalLabel =
      total != null
        ? `${Number.isInteger(total) ? String(total) : total.toFixed(2)} ${currency}`.trim()
        : currency.trim();

    const buyerBody =
      firstLineTitle != null
        ? `Your shop order is confirmed (${totalLabel}). Includes: ${firstLineTitle}.`
        : `Your shop order is confirmed (${totalLabel}).`;

    const sellerBody =
      firstLineTitle != null
        ? `You have a new sale from checkout (${totalLabel}). First item: ${firstLineTitle}.`
        : `You have a new sale from checkout (${totalLabel}).`;

    return [
      {
        userId: buyerId,
        type: 'shop_order_placed',
        title: 'Order placed',
        body: buyerBody,
        referenceType: 'catalog_order',
        referenceId: orderId,
        dedupeKey: `shop-order-placed-buyer-${orderId}`
      },
      {
        userId: sellerId,
        type: 'shop_order_placed',
        title: 'New sale (checkout)',
        body: sellerBody,
        referenceType: 'catalog_order',
        referenceId: orderId,
        dedupeKey: `shop-order-placed-seller-${orderId}`
      }
    ];
  }

  private mapShopOrderStatusChanged(payload: PlainObject): MappedNotification[] {
    const orderId = asString(payload.orderId);
    const buyerId = asString(payload.buyerId);
    const sellerId = asString(payload.sellerId);
    const previousStatus = asString(payload.previousStatus);
    const newStatus = asString(payload.newStatus);

    if (orderId == null || buyerId == null || sellerId == null || previousStatus == null || newStatus == null) {
      logger.warn('Skipping shop.order.status_changed event due to missing fields');
      return [];
    }

    const body = `Shop order status changed from "${previousStatus}" to "${newStatus}".`;

    return [
      {
        userId: buyerId,
        type: 'shop_order_status_changed',
        title: 'Order status updated',
        body,
        referenceType: 'catalog_order',
        referenceId: orderId,
        dedupeKey: `shop-order-status-${orderId}-buyer-${previousStatus}-${newStatus}`
      },
      {
        userId: sellerId,
        type: 'shop_order_status_changed',
        title: 'Order status updated',
        body,
        referenceType: 'catalog_order',
        referenceId: orderId,
        dedupeKey: `shop-order-status-${orderId}-seller-${previousStatus}-${newStatus}`
      }
    ];
  }

  private mapRequestDealPaid(payload: PlainObject): MappedNotification[] {
    const orderId = asString(payload.orderId);
    const buyerId = asString(payload.buyerId);
    const sellerId = asString(payload.sellerId);
    const title = asString(payload.title);
    const currency = asString(payload.currency) ?? '';
    const amount = asNumber(payload.amount);

    if (orderId == null || buyerId == null || sellerId == null) {
      logger.warn('Skipping request_deal.paid event due to missing orderId, buyerId, or sellerId');
      return [];
    }

    const totalLabel =
      amount != null
        ? `${Number.isInteger(amount) ? String(amount) : amount.toFixed(2)} ${currency}`.trim()
        : currency.trim();

    const buyerBody =
      title != null ? `You paid for “${title}” (${totalLabel}).` : `Your payment went through (${totalLabel}).`;
    const sellerBody =
      title != null ? `A buyer purchased “${title}” (${totalLabel}).` : `You have a new sale (${totalLabel}).`;

    return [
      {
        userId: buyerId,
        type: 'request_deal_paid',
        title: 'Purchase complete',
        body: buyerBody,
        referenceType: 'request_deal_order',
        referenceId: orderId,
        dedupeKey: `request-deal-paid-buyer-${orderId}`
      },
      {
        userId: sellerId,
        type: 'request_deal_paid',
        title: 'New sale',
        body: sellerBody,
        referenceType: 'request_deal_order',
        referenceId: orderId,
        dedupeKey: `request-deal-paid-seller-${orderId}`
      }
    ];
  }

  private mapRequestDealStatusChanged(payload: PlainObject): MappedNotification[] {
    const orderId = asString(payload.orderId);
    const buyerId = asString(payload.buyerId);
    const sellerId = asString(payload.sellerId);
    const title = asString(payload.title);
    const previousStatus = asString(payload.previousStatus);
    const newStatus = asString(payload.newStatus);

    if (orderId == null || buyerId == null || sellerId == null || previousStatus == null || newStatus == null) {
      logger.warn('Skipping request_deal.status_changed event due to missing fields');
      return [];
    }

    const label = title != null ? ` for “${title}”` : '';
    const body = `Order${label} status changed from "${previousStatus}" to "${newStatus}".`;

    return [
      {
        userId: buyerId,
        type: 'request_deal_status_changed',
        title: 'Order status updated',
        body,
        referenceType: 'request_deal_order',
        referenceId: orderId,
        dedupeKey: `request-deal-status-${orderId}-buyer-${previousStatus}-${newStatus}`
      },
      {
        userId: sellerId,
        type: 'request_deal_status_changed',
        title: 'Order status updated',
        body,
        referenceType: 'request_deal_order',
        referenceId: orderId,
        dedupeKey: `request-deal-status-${orderId}-seller-${previousStatus}-${newStatus}`
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
