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
import prisma from '../../../config/prisma';
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
  },
  request: {
    select: {
      id: true,
      title: true,
      status: true,
      budgetMin: true,
      budgetMax: true,
      currency: true,
      location: true,
      quantity: true
    }
  },
  offer: {
    select: {
      id: true,
      price: true,
      currency: true,
      status: true
    }
  },
  buyer: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          fullName: true,
          avatarUrl: true,
          buyerProfile: {
            select: {
              displayName: true,
              city: true
            }
          }
        }
      }
    }
  },
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          fullName: true,
          avatarUrl: true,
          city: true,
          sellerProfile: {
            select: {
              displayName: true,
              businessType: true,
              ratingAverage: true,
              completedDealsCount: true
            }
          }
        }
      }
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
  request: {
    id: string;
    title: string;
    status: string;
    budgetMin: Prisma.Decimal | null;
    budgetMax: Prisma.Decimal | null;
    currency: string;
    location: string | null;
    quantity: number;
  };
  offer: {
    id: string;
    price: Prisma.Decimal;
    currency: string;
    status: string;
  } | null;
  buyer: ConversationUserSummary;
  seller: ConversationUserSummary;
};

type ConversationUserSummary = {
  id: string;
  name: string;
  email: string | null;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    city?: string | null;
    buyerProfile?: {
      displayName: string;
      city: string | null;
    } | null;
    sellerProfile?: {
      displayName: string;
      businessType: string | null;
      ratingAverage: Prisma.Decimal;
      completedDealsCount: number;
    } | null;
  } | null;
};

export type ConversationListItem = ConversationWithPreview & {
  lastMessage: MessageWithReadStates | null;
  unreadCount: number;
  otherParticipant: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    role: 'buyer' | 'seller';
    city: string | null;
    ratingAverage?: string;
    completedDealsCount?: number;
    businessType?: string | null;
  };
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
  listUserConversations(userId: string, status: ConversationStatus | undefined, page: number, limit: number): Promise<RequestListResult<ConversationListItem>>;
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
  ): Promise<RequestListResult<ConversationListItem>> {
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

    const unreadCounts = await this.getUnreadCounts(
      items.map((conversation) => conversation.id),
      userId
    );

    return {
      items: items.map((conversation) => this.mapConversationListItem(conversation, userId, unreadCounts)),
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

  private async getUnreadCounts(conversationIds: string[], userId: string): Promise<Map<string, number>> {
    if (conversationIds.length === 0) {
      return new Map();
    }

    const grouped = await this.client.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: {
          in: conversationIds
        },
        senderId: {
          not: userId
        },
        readStates: {
          none: {
            userId
          }
        }
      },
      _count: {
        _all: true
      }
    });

    return new Map(grouped.map((item) => [item.conversationId, item._count._all]));
  }

  private mapConversationListItem(
    conversation: ConversationWithPreview,
    userId: string,
    unreadCounts: Map<string, number>
  ): ConversationListItem {
    const otherRole = conversation.buyerId === userId ? 'seller' : 'buyer';
    const otherUser = otherRole === 'seller' ? conversation.seller : conversation.buyer;
    const profile = otherUser.profile;
    const displayName =
      otherRole === 'seller'
        ? profile?.sellerProfile?.displayName ?? profile?.fullName ?? otherUser.name
        : profile?.buyerProfile?.displayName ?? profile?.fullName ?? otherUser.name;

    return {
      ...conversation,
      lastMessage: conversation.messages[0] ?? null,
      unreadCount: unreadCounts.get(conversation.id) ?? 0,
      otherParticipant: {
        id: otherUser.id,
        name: displayName,
        email: otherUser.email,
        avatarUrl: profile?.avatarUrl ?? null,
        role: otherRole,
        city: otherRole === 'seller'
          ? profile?.city ?? null
          : profile?.buyerProfile?.city ?? null,
        ...(otherRole === 'seller'
          ? {
              ratingAverage: profile?.sellerProfile?.ratingAverage?.toString() ?? '0',
              completedDealsCount: profile?.sellerProfile?.completedDealsCount ?? 0,
              businessType: profile?.sellerProfile?.businessType ?? null
            }
          : {})
      }
    };
  }
}

export default ChatRepository;
