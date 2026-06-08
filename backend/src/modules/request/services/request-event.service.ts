import { RequestWithRelations } from '../repositories/request.repository';
import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';

export interface RequestEventPublisherLike {
  publishRequestPublished(request: RequestWithRelations): Promise<void>;
  publishRequestUpdated(request: RequestWithRelations): Promise<void>;
  publishRequestClosed(request: RequestWithRelations): Promise<void>;
  publishRequestAccepted(request: RequestWithRelations): Promise<void>;
}

export class RequestEventPublisher implements RequestEventPublisherLike {
  async publishRequestPublished(request: RequestWithRelations): Promise<void> {
    await this.publish('request.published', request);
  }

  async publishRequestUpdated(request: RequestWithRelations): Promise<void> {
    await this.publish('request.updated', request);
  }

  async publishRequestClosed(request: RequestWithRelations): Promise<void> {
    await this.publish('request.closed', request);
  }

  async publishRequestAccepted(request: RequestWithRelations): Promise<void> {
    await this.publish('request.accepted', request);
  }

  private async publish(channel: string, request: RequestWithRelations): Promise<void> {
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
          requestId: request.id,
          buyerId: request.buyerId,
          status: request.status,
          publishedAt: request.publishedAt,
          closedAt: request.closedAt,
          updatedAt: request.updatedAt
        })
      );
    } catch (error) {
      logger.warn(`Failed to publish Redis event to ${channel}: ${(error as Error).message}`);
    }
  }
}

export default RequestEventPublisher;
