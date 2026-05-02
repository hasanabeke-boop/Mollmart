import { ConversationStatus, MessageType, SenderRole } from '@prisma/client';

export interface CreateConversationInput {
  requestId: string;
  offerId?: string;
  sellerId?: string;
}

export interface SendMessageInput {
  body: string;
  messageType?: MessageType;
}

export interface ConversationListQuery {
  status?: ConversationStatus;
  page: number;
  limit: number;
}

export interface MessageListQuery {
  page: number;
  limit: number;
}

export interface RequestSummary {
  id: string;
  buyerId: string;
  status: string;
  deadlineAt: string | null;
}

export interface OfferSummary {
  id: string;
  requestId: string;
  sellerId: string;
  status: string;
}

export interface RequestListResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessageReadEventPayload {
  conversationId: string;
  messageIds: string[];
  readByUserId: string;
}

export interface ParticipantContext {
  requestId: string;
  offerId?: string;
  buyerId: string;
  sellerId: string;
}

export interface ConversationParticipant {
  senderRole: SenderRole;
  counterpartyId: string;
}
