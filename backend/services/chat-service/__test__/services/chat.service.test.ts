import { Conversation, MessageType, SenderRole } from '@prisma/client';
import ChatService from '../../src/services/chat.service';
import {
  ChatRepositoryLike,
  ConversationWithPreview,
  MessageWithReadStates
} from '../../src/repositories/chat.repository';
import { ChatEventPublisherLike } from '../../src/services/chat-event.service';
import { OfferServiceClientLike } from '../../src/services/offer-service.client';
import { RequestServiceClientLike } from '../../src/services/request-service.client';
import { AuthUser } from '../../src/types/express';

function makeConversation(overrides?: Partial<Conversation>): Conversation {
  const now = new Date('2026-03-28T09:00:00.000Z');

  return {
    id: 'conv-1',
    requestId: 'request-1',
    offerId: 'offer-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    ...overrides
  };
}

function makeConversationWithPreview(overrides?: Partial<ConversationWithPreview>): ConversationWithPreview {
  return {
    ...makeConversation(),
    messages: [],
    ...overrides
  };
}

function makeMessage(overrides?: Partial<MessageWithReadStates>): MessageWithReadStates {
  const now = new Date('2026-03-28T09:10:00.000Z');

  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'seller-1',
    senderRole: SenderRole.seller,
    body: 'Hello there',
    messageType: MessageType.text,
    createdAt: now,
    readStates: [],
    ...overrides
  };
}

function createRepositoryMock(
  conversation: Conversation = makeConversation()
): jest.Mocked<ChatRepositoryLike> {
  return {
    findConversationById: jest.fn(async () => conversation),
    findUniqueConversation: jest.fn(async () => null),
    createConversation: jest.fn(async (data) =>
      makeConversation({
        requestId: data.requestId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        offerId: data.offerId ?? null
      })
    ),
    updateConversationOfferContext: jest.fn(async (_id, offerId) =>
      makeConversation({
        offerId
      })
    ),
    listUserConversations: jest.fn(),
    getConversationWithLastMessage: jest.fn(async () => makeConversationWithPreview()),
    listMessages: jest.fn(),
    createMessage: jest.fn(async (_conversationId, senderId, senderRole, body) =>
      makeMessage({
        senderId,
        senderRole,
        body
      })
    ),
    markMessagesRead: jest.fn(async () => [makeMessage()])
  };
}

function createEventPublisherMock(): jest.Mocked<ChatEventPublisherLike> {
  return {
    publishConversationCreated: jest.fn(async () => undefined),
    publishMessageCreated: jest.fn(async () => undefined),
    publishMessagesRead: jest.fn(async () => undefined)
  };
}

function createRequestClientMock(): jest.Mocked<RequestServiceClientLike> {
  return {
    getRequestById: jest.fn(async () => ({
      id: 'request-1',
      buyerId: 'buyer-1',
      status: 'published',
      deadlineAt: '2026-04-20T00:00:00.000Z'
    }))
  };
}

function createOfferClientMock(): jest.Mocked<OfferServiceClientLike> {
  return {
    getOfferById: jest.fn(async () => ({
      id: 'offer-1',
      requestId: 'request-1',
      sellerId: 'seller-1',
      status: 'submitted'
    }))
  };
}

describe('ChatService', () => {
  const buyer: AuthUser = { id: 'buyer-1', role: 'buyer' };
  const seller: AuthUser = { id: 'seller-1', role: 'seller' };
  const outsider: AuthUser = { id: 'outsider-1', role: 'seller' };

  it('blocks non-participants from reading a conversation', async () => {
    const service = new ChatService(
      createRepositoryMock(),
      createEventPublisherMock(),
      createRequestClientMock(),
      createOfferClientMock()
    );

    await expect(service.getConversation(outsider, 'conv-1')).rejects.toThrow(
      'Only participants can access this conversation'
    );
  });

  it('sends a message for a participant and publishes an event', async () => {
    const repository = createRepositoryMock();
    const events = createEventPublisherMock();
    const service = new ChatService(
      repository,
      events,
      createRequestClientMock(),
      createOfferClientMock()
    );

    const message = await service.sendMessage(seller, 'conv-1', {
      body: 'We can deliver next week'
    });

    expect(message.senderId).toBe('seller-1');
    expect(repository.createMessage).toHaveBeenCalledWith(
      'conv-1',
      'seller-1',
      SenderRole.seller,
      'We can deliver next week',
      MessageType.text
    );
    expect(events.publishMessageCreated).toHaveBeenCalledTimes(1);
  });

  it('marks recipient unread messages as read and publishes an event', async () => {
    const repository = createRepositoryMock();
    const events = createEventPublisherMock();
    const service = new ChatService(
      repository,
      events,
      createRequestClientMock(),
      createOfferClientMock()
    );

    const result = await service.markConversationRead(buyer, 'conv-1');

    expect(result).toHaveLength(1);
    expect(repository.markMessagesRead).toHaveBeenCalledWith('conv-1', 'buyer-1');
    expect(events.publishMessagesRead).toHaveBeenCalledTimes(1);
  });
});
