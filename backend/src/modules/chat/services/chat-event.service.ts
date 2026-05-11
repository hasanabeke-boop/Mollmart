import { Conversation, Message } from '@prisma/client';
import { getRedisClient } from '../../../config/redis';
import logger from '../../../middleware/logger';
import { MessageCreatedEventPayload, MessageReadEventPayload } from '../types/chat';

export interface ChatEventPublisherLike {
  publishConversationCreated(conversation: Conversation): Promise<void>;
  publishMessageCreated(payload: MessageCreatedEventPayload): Promise<void>;
  publishMessagesRead(payload: MessageReadEventPayload): Promise<void>;
}

export class ChatEventPublisher implements ChatEventPublisherLike {
  async publishConversationCreated(conversation: Conversation): Promise<void> {
    await this.publish('chat.conversation.created', conversation);
  }

  async publishMessageCreated(payload: MessageCreatedEventPayload): Promise<void> {
    await this.publish('chat.message.created', payload);
  }

  async publishMessagesRead(payload: MessageReadEventPayload): Promise<void> {
    await this.publish('chat.message.read', payload);
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

export default ChatEventPublisher;
