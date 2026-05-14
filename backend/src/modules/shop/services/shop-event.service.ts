import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';

export type OrderPlacedEventPayload = {
  orderId: string;
  buyerId: string;
  sellerId: string;
  total: number;
  currency: string;
  firstLineTitle?: string;
};

export type OrderStatusChangedPayload = {
  orderId: string;
  buyerId: string;
  sellerId: string;
  previousStatus: string;
  newStatus: string;
};

export interface ShopEventPublisherLike {
  publishOrderPlaced(payload: OrderPlacedEventPayload): Promise<void>;
  publishOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void>;
}

export class ShopEventPublisher implements ShopEventPublisherLike {
  async publishOrderPlaced(payload: OrderPlacedEventPayload): Promise<void> {
    await this.publish('shop.order.placed', payload);
  }

  async publishOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
    await this.publish('shop.order.status_changed', payload);
  }

  private async publish(channel: string, payload: unknown): Promise<void> {
    const client = getRedisClient();

    if (client == null) {
      return;
    }

    try {
      if (client.status === 'wait') {
        await client.connect();
      }

      await client.publish(channel, JSON.stringify(payload));
    } catch (error) {
      logger.warn(`Failed to publish Redis event to ${channel}: ${(error as Error).message}`);
    }
  }
}

export default ShopEventPublisher;
