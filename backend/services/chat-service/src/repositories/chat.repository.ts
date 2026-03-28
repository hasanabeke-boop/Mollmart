import {
  Conversation,
  ConversationStatus,
  Message,
  MessageReadState,
  MessageType,
  Prisma,
  PrismaClient,
  SenderRole
} from '@prisma/client';
import prisma from '../config/prisma';
import { buildPageMeta } from '../utils/pagination';
import { MessageListQuery, RequestListResult } from '../types/chat';

const conversationInclude = {
  messages: {
    orderBy: {
      createdAt: 'desc'
    },
    take: 1,
    include: {
      readStates: true
    }
  }
} satisfies Prisma.ConversationInclude;

const messageInclude = {
  readStates: true
} satisfies Prisma.MessageInclude;

export type MessageWithReadStates = Message & {
  readStates: MessageReadState[];
};

export type ConversationWithPreview = Conversation & {
  messages: MessageWithReadStates[];
};

export interface ConversationRecordInput {
  requestId: string;
  offerId?: string;
  buyerId: string;
  sellerId: string;
}

export interface ChatRepositoryLike {
  findConversationById(id: string): Promise<Conversation | null>;
  findUniqueConversation(requestId: string, buyerId: string, sellerId: string): Promise<Conversation | null>;
  createConversation(data: ConversationRecordInput): Promise<Conversation>;
  updateConversationOfferContext(id: string, offerId: string): Promise<Conversation>;
  listUserConversations(userId: string, status: ConversationStatus | undefined, page: number, limit: number): Promise<RequestListResult<ConversationWithPreview>>;
  getConversationWithLastMessage(id: string): Promise<ConversationWithPreview | null>;
  listMessages(conversationId: string, page: number, limit: number): Promise<RequestListResult<MessageWithReadStates>>;
  createMessage(conversationId: string, senderId: string, senderRole: SenderRole, body: string, messageType: MessageType): Promise<MessageWithReadStates>;
  markMessagesRead(conversationId: string, readerUserId: string): Promise<MessageWithReadStates[]>;
}

export class ChatRepository implements ChatRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findConversationById(id: string): Promise<Conversation | null> {
    return this.client.conversation.findUnique({
      where: { id }
    });
  }

  async findUniqueConversation(requestId: string, buyerId: string, sellerId: string): Promise<Conversation | null> {
    return this.client.conversation.findUnique({
      where: {
        requestId_buyerId_sellerId: {
          requestId,
          buyerId,
          sellerId
        }
      }
    });
  }

  async createConversation(data: ConversationRecordInput): Promise<Conversation> {
    return this.client.conversation.create({
      data: {
        requestId: data.requestId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        ...(data.offerId !== undefined ? { offerId: data.offerId } : {})
      }
    });
  }

  async updateConversationOfferContext(id: string, offerId: string): Promise<Conversation> {
    return this.client.conversation.update({
      where: { id },
      data: { offerId }
    });
  }

  async listUserConversations(
    userId: string,
    status: ConversationStatus | undefined,
    page: number,
    limit: number
  ): Promise<RequestListResult<ConversationWithPreview>> {
    const where: Prisma.ConversationWhereInput = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      ...(status !== undefined ? { status } : {})
    };

    const [items, total] = await Promise.all([
      this.client.conversation.findMany({
        where,
        include: conversationInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { lastMessageAt: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      this.client.conversation.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(page, limit, total)
    };
  }

  async getConversationWithLastMessage(id: string): Promise<ConversationWithPreview | null> {
    return this.client.conversation.findUnique({
      where: { id },
      include: conversationInclude
    });
  }

  async listMessages(
    conversationId: string,
    page: number,
    limit: number
  ): Promise<RequestListResult<MessageWithReadStates>> {
    const where: Prisma.MessageWhereInput = {
      conversationId
    };

    const [items, total] = await Promise.all([
      this.client.message.findMany({
        where,
        include: messageInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.client.message.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(page, limit, total)
    };
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    senderRole: SenderRole,
    body: string,
    messageType: MessageType
  ): Promise<MessageWithReadStates> {
    return this.client.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          senderRole,
          body,
          messageType
        },
        include: messageInclude
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: message.createdAt
        }
      });

      return message;
    });
  }

  async markMessagesRead(conversationId: string, readerUserId: string): Promise<MessageWithReadStates[]> {
    return this.client.$transaction(async (tx) => {
      const unreadMessages = await tx.message.findMany({
        where: {
          conversationId,
          senderId: {
            not: readerUserId
          },
          readStates: {
            none: {
              userId: readerUserId
            }
          }
        }
      });

      if (unreadMessages.length === 0) {
        return [];
      }

      await tx.messageReadState.createMany({
        data: unreadMessages.map((message) => ({
          messageId: message.id,
          userId: readerUserId
        })),
        skipDuplicates: true
      });

      return tx.message.findMany({
        where: {
          id: {
            in: unreadMessages.map((message) => message.id)
          }
        },
        include: messageInclude
      });
    });
  }
}

export default ChatRepository;
