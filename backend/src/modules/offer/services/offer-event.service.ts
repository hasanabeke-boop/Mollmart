import { OfferWithRelations } from '../repositories/offer.repository';
import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';

export interface OfferEventPublisherLike {
  publishOfferCreated(offer: OfferWithRelations): Promise<void>;
  publishOfferUpdated(offer: OfferWithRelations): Promise<void>;
  publishOfferWithdrawn(offer: OfferWithRelations): Promise<void>;
  publishOfferAccepted(offer: OfferWithRelations): Promise<void>;
  publishOfferRejected(offer: OfferWithRelations): Promise<void>;
}

export class OfferEventPublisher implements OfferEventPublisherLike {
  async publishOfferCreated(offer: OfferWithRelations): Promise<void> {
    await this.publish('offer.created', offer);
  }

  async publishOfferUpdated(offer: OfferWithRelations): Promise<void> {
    await this.publish('offer.updated', offer);
  }

  async publishOfferWithdrawn(offer: OfferWithRelations): Promise<void> {
    await this.publish('offer.withdrawn', offer);
  }

  async publishOfferAccepted(offer: OfferWithRelations): Promise<void> {
    await this.publish('offer.accepted', offer);
  }

  async publishOfferRejected(offer: OfferWithRelations): Promise<void> {
    await this.publish('offer.rejected', offer);
  }

  private async publish(channel: string, offer: OfferWithRelations): Promise<void> {
    const client = getRedisClient();

    if (client == null) {
      return;
    }

    try {
      if (client.status === 'wait') {
        await client.connect();
      }

      await client.publish(
        channel,
        JSON.stringify({
          offerId: offer.id,
          requestId: offer.requestId,
          sellerId: offer.sellerId,
          status: offer.status,
          acceptedAt: offer.acceptedAt,
          withdrawnAt: offer.withdrawnAt,
          updatedAt: offer.updatedAt
        })
      );
    } catch (error) {
      logger.warn(`Failed to publish Redis event to ${channel}: ${(error as Error).message}`);
    }
  }
}

export default OfferEventPublisher;
