import { Conversation, ConversationStatus, MessageType, SenderRole } from '@prisma/client';
import { AuthUser } from '../types/express';
import {
  ConversationListQuery,
  CreateConversationInput,
  MessageListQuery,
  ParticipantContext,
  SendMessageInput
} from '../types/chat';
import { badRequest, forbidden, notFound } from '../utils/apiError';
import {
  ChatRepositoryLike,
  ConversationWithPreview,
  MessageWithReadStates
} from '../repositories/chat.repository';
import { ChatEventPublisherLike } from './chat-event.service';
import { RequestServiceClientLike } from './request-service.client';
import { OfferServiceClientLike } from './offer-service.client';

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepositoryLike,
    private readonly chatEventPublisher: ChatEventPublisherLike,
    private readonly requestServiceClient: RequestServiceClientLike,
    private readonly offerServiceClient: OfferServiceClientLike
  ) {}

  async openConversation(user: AuthUser, input: CreateConversationInput) {
    const context = await this.resolveParticipantContext(user, input);

    const existing = await this.chatRepository.findUniqueConversation(
      context.requestId,
      context.buyerId,
      context.sellerId
    );

    if (existing != null) {
      let conversation = existing;

      if (existing.offerId == null && context.offerId !== undefined) {
        conversation = await this.chatRepository.updateConversationOfferContext(
          existing.id,
          context.offerId
        );
      }

      return this.ensureConversationStatus(conversation, ConversationStatus.active, user.id);
    }

    const conversation = await this.chatRepository.createConversation(context);
    await this.chatEventPublisher.publishConversationCreated(conversation);
    return conversation;
  }

  async listConversations(user: AuthUser, query: ConversationListQuery) {
    return this.chatRepository.listUserConversations(user.id, query.status, query.page, query.limit);
  }

  async getConversation(user: AuthUser, conversationId: string): Promise<ConversationWithPreview> {
    const conversation = await this.chatRepository.getConversationWithLastMessage(conversationId);
    if (conversation == null) {
      throw notFound('Conversation not found');
    }

    this.assertParticipant(conversation, user.id);
    return conversation;
  }

  async listMessages(user: AuthUser, conversationId: string, query: MessageListQuery) {
    const conversation = await this.getConversation(user, conversationId);
    this.assertParticipant(conversation, user.id);
    return this.chatRepository.listMessages(conversationId, query.page, query.limit);
  }

  async sendMessage(
    user: AuthUser,
    conversationId: string,
    input: SendMessageInput
  ): Promise<MessageWithReadStates> {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (conversation == null) {
      throw notFound('Conversation not found');
    }

    this.assertParticipant(conversation, user.id);

    if (conversation.status === ConversationStatus.closed) {
      throw badRequest('Conversation is closed. Reopen it before sending messages');
    }

    const senderRole = this.resolveSenderRole(conversation, user);
    const message = await this.chatRepository.createMessage(
      conversationId,
      user.id,
      senderRole,
      input.body.trim(),
      input.messageType ?? MessageType.text
    );

    await this.chatEventPublisher.publishMessageCreated(message);
    return message;
  }

  async markConversationRead(user: AuthUser, conversationId: string): Promise<MessageWithReadStates[]> {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (conversation == null) {
      throw notFound('Conversation not found');
    }

    this.assertParticipant(conversation, user.id);

    const readMessages = await this.chatRepository.markMessagesRead(conversationId, user.id);

    if (readMessages.length > 0) {
      await this.chatEventPublisher.publishMessagesRead({
        conversationId,
        messageIds: readMessages.map((message) => message.id),
        readByUserId: user.id
      });
    }

    return readMessages;
  }

  async closeConversation(user: AuthUser, conversationId: string): Promise<Conversation> {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (conversation == null) {
      throw notFound('Conversation not found');
    }

    this.assertParticipant(conversation, user.id);
    return this.ensureConversationStatus(conversation, ConversationStatus.closed, user.id);
  }

  async reopenConversation(user: AuthUser, conversationId: string): Promise<Conversation> {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (conversation == null) {
      throw notFound('Conversation not found');
    }

    this.assertParticipant(conversation, user.id);
    return this.ensureConversationStatus(conversation, ConversationStatus.active, user.id);
  }

  private async resolveParticipantContext(
    user: AuthUser,
    input: CreateConversationInput
  ): Promise<ParticipantContext> {
    const request = await this.requestServiceClient.getRequestById(input.requestId, user);

    if (!['published', 'has_offers', 'in_negotiation', 'accepted'].includes(request.status)) {
      throw badRequest('Conversation can only be created for a valid marketplace request context');
    }

    if (user.role === 'buyer') {
      if (request.buyerId !== user.id) {
        throw forbidden('Buyer can only open conversations for their own requests');
      }

      const sellerId = await this.resolveSellerId(input);

      return {
        requestId: input.requestId,
        buyerId: user.id,
        sellerId,
        ...(input.offerId !== undefined ? { offerId: input.offerId } : {})
      };
    }

    if (user.role === 'seller') {
      if (request.buyerId === user.id) {
        throw badRequest('Request owner cannot open the seller side of the same conversation');
      }

      if (input.sellerId !== undefined && input.sellerId !== user.id) {
        throw forbidden('Seller can only open conversations for their own seller identity');
      }

      if (input.offerId !== undefined) {
        await this.validateOfferContext(input.offerId, input.requestId, user.id);
      }

      return {
        requestId: input.requestId,
        buyerId: request.buyerId,
        sellerId: user.id,
        ...(input.offerId !== undefined ? { offerId: input.offerId } : {})
      };
    }

    throw forbidden('Only buyers and sellers can open marketplace conversations');
  }

  private async resolveSellerId(input: CreateConversationInput): Promise<string> {
    if (input.sellerId !== undefined) {
      return input.sellerId;
    }

    if (input.offerId !== undefined) {
      const offer = await this.offerServiceClient.getOfferById(input.offerId);
      if (offer != null) {
        return offer.sellerId;
      }
    }

    throw badRequest('sellerId is required when offerId cannot be validated');
  }

  private async validateOfferContext(offerId: string, requestId: string, sellerId: string): Promise<void> {
    const offer = await this.offerServiceClient.getOfferById(offerId);

    if (offer == null) {
      return;
    }

    if (offer.requestId !== requestId) {
      throw badRequest('offerId does not belong to the supplied requestId');
    }

    if (offer.sellerId !== sellerId) {
      throw forbidden('Seller can only link conversations to their own offers');
    }
  }

  private assertParticipant(
    conversation: { buyerId: string; sellerId: string },
    userId: string
  ): void {
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw forbidden('Only participants can access this conversation');
    }
  }

  private resolveSenderRole(
    conversation: { buyerId: string; sellerId: string },
    user: AuthUser
  ): SenderRole {
    if (conversation.buyerId === user.id) {
      return SenderRole.buyer;
    }

    if (conversation.sellerId === user.id) {
      return SenderRole.seller;
    }

    throw forbidden('Only participants can send messages');
  }

  private async ensureConversationStatus(
    conversation: Conversation,
    status: ConversationStatus,
    updatedByUserId: string
  ): Promise<Conversation> {
    if (conversation.status === status) {
      return conversation;
    }

    const updatedConversation = await this.chatRepository.updateConversationStatus(
      conversation.id,
      status
    );

    await this.chatEventPublisher.publishConversationStatusChanged({
      conversationId: updatedConversation.id,
      status: updatedConversation.status,
      updatedByUserId
    });

    return updatedConversation;
  }
}

export default ChatService;
