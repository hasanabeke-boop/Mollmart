import { Conversation, Message } from '@prisma/client';
import { getRedisClient } from '../config/redis';
import logger from '../middleware/logger';
import {
  ConversationStatusChangePayload,
  MessageReadEventPayload
} from '../types/chat';

export interface ChatEventPublisherLike {
  publishConversationCreated(conversation: Conversation): Promise<void>;
  publishMessageCreated(message: Message): Promise<void>;
  publishMessagesRead(payload: MessageReadEventPayload): Promise<void>;
  publishConversationStatusChanged(payload: ConversationStatusChangePayload): Promise<void>;
}

export class ChatEventPublisher implements ChatEventPublisherLike {
  async publishConversationCreated(conversation: Conversation): Promise<void> {
    await this.publish('chat.conversation.created', conversation);
  }

  async publishMessageCreated(message: Message): Promise<void> {
    await this.publish('chat.message.created', message);
  }

  async publishMessagesRead(payload: MessageReadEventPayload): Promise<void> {
    await this.publish('chat.message.read', payload);
  }

  async publishConversationStatusChanged(
    payload: ConversationStatusChangePayload
  ): Promise<void> {
    await this.publish('chat.conversation.status.changed', payload);
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
