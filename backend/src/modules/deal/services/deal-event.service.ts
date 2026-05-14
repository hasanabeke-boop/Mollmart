import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';

export type RequestDealPaidPayload = {
  orderId: string;
  buyerId: string;
  sellerId: string;
  title: string;
  amount: number;
  currency: string;
};

export type RequestDealStatusChangedPayload = {
  orderId: string;
  buyerId: string;
  sellerId: string;
  title: string;
  previousStatus: string;
  newStatus: string;
};

export interface DealEventPublisherLike {
  publishRequestDealPaid(payload: RequestDealPaidPayload): Promise<void>;
  publishRequestDealStatusChanged(payload: RequestDealStatusChangedPayload): Promise<void>;
}

export class DealEventPublisher implements DealEventPublisherLike {
  async publishRequestDealPaid(payload: RequestDealPaidPayload): Promise<void> {
    await this.publish('request_deal.paid', payload);
  }

  async publishRequestDealStatusChanged(payload: RequestDealStatusChangedPayload): Promise<void> {
    await this.publish('request_deal.status_changed', payload);
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

export default DealEventPublisher;
