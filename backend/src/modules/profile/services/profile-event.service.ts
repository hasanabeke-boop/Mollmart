import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';
import { FullProfile } from '../repositories/profile.repository';

export interface ProfileEventPublisherLike {
  publishProfileUpdated(profile: FullProfile): Promise<void>;
  publishSellerProfileUpdated(profile: FullProfile): Promise<void>;
  publishBuyerProfileUpdated(profile: FullProfile): Promise<void>;
}

export class ProfileEventPublisher implements ProfileEventPublisherLike {
  async publishProfileUpdated(profile: FullProfile): Promise<void> {
    await this.publish('profile.updated', profile);
  }

  async publishSellerProfileUpdated(profile: FullProfile): Promise<void> {
    await this.publish('profile.seller.updated', profile);
  }

  async publishBuyerProfileUpdated(profile: FullProfile): Promise<void> {
    await this.publish('profile.buyer.updated', profile);
  }

  private async publish(channel: string, profile: FullProfile): Promise<void> {
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
          userId: profile.userId,
          role: profile.role,
          updatedAt: profile.updatedAt
        })
      );
    } catch (error) {
      logger.warn(`Failed to publish Redis event to ${channel}: ${(error as Error).message}`);
    }
  }
}

export default ProfileEventPublisher;
