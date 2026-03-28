import { RequestStatus } from '@prisma/client';
import RequestService from '../../src/services/request.service';
import {
  RequestRepositoryLike,
  RequestWithRelations
} from '../../src/repositories/request.repository';
import { RequestEventPublisherLike } from '../../src/services/request-event.service';
import { AuthUser } from '../../src/types/express';

function makeRequest(overrides?: Partial<RequestWithRelations>): RequestWithRelations {
  const now = new Date('2026-03-28T08:00:00.000Z');

  return {
    id: 'req-1',
    buyerId: 'buyer-1',
    title: 'Office desks',
    description: 'Need 25 office desks for a new branch office',
    categoryId: 'furniture',
    budgetMin: 1000 as never,
    budgetMax: 5000 as never,
    currency: 'USD',
    location: 'Almaty',
    deadlineAt: new Date('2026-04-15T00:00:00.000Z'),
    status: 'draft',
    offerCount: 0,
    isNegotiable: true,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    closedAt: null,
    attachments: [],
    statusHistory: [],
    ...overrides
  };
}

function createRepositoryMock(initialRequest: RequestWithRelations): jest.Mocked<RequestRepositoryLike> {
  let current = initialRequest;

  return {
    createDraft: jest.fn(async (data) =>
      makeRequest({
        buyerId: data.buyerId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        currency: data.currency,
        isNegotiable: data.isNegotiable
      })
    ),
    findById: jest.fn(async () => current),
    publish: jest.fn(async () => {
      current = makeRequest({
        ...current,
        status: 'published',
        publishedAt: new Date('2026-03-28T09:00:00.000Z')
      });
      return current;
    }),
    update: jest.fn(async (_id, data) => {
      current = makeRequest({
        ...current,
        ...data
      });
      return current;
    }),
    transitionStatus: jest.fn(async (_id, toStatus: RequestStatus) => {
      current = makeRequest({
        ...current,
        status: toStatus,
        closedAt: toStatus === 'closed' || toStatus === 'cancelled' ? new Date('2026-03-28T10:00:00.000Z') : null
      });
      return current;
    }),
    listOwnerRequests: jest.fn(),
    listSellerBoard: jest.fn()
  };
}

function createPublisherMock(): jest.Mocked<RequestEventPublisherLike> {
  return {
    publishRequestPublished: jest.fn(async () => undefined),
    publishRequestUpdated: jest.fn(async () => undefined),
    publishRequestClosed: jest.fn(async () => undefined),
    publishRequestAccepted: jest.fn(async () => undefined)
  };
}

describe('RequestService', () => {
  const buyer: AuthUser = { id: 'buyer-1', role: 'buyer' };
  const seller: AuthUser = { id: 'seller-1', role: 'seller' };

  it('allows only buyers to create requests', async () => {
    const repository = createRepositoryMock(makeRequest());
    const publisher = createPublisherMock();
    const service = new RequestService(repository, publisher);

    await expect(
      service.createRequest(seller, {
        title: 'Need laptops',
        description: 'Need 20 laptops for a new team',
        categoryId: 'electronics',
        currency: 'USD'
      })
    ).rejects.toThrow('Only buyers can create requests');
  });

  it('publishes a draft request and emits an event', async () => {
    const repository = createRepositoryMock(makeRequest());
    const publisher = createPublisherMock();
    const service = new RequestService(repository, publisher);

    const result = await service.publishRequest(buyer, 'req-1');

    expect(result.status).toBe('published');
    expect(repository.publish).toHaveBeenCalledWith('req-1', 'buyer-1', 'Published by buyer');
    expect(publisher.publishRequestPublished).toHaveBeenCalledTimes(1);
  });

  it('blocks full rewrites after offers exist', async () => {
    const repository = createRepositoryMock(
      makeRequest({
        status: 'has_offers',
        offerCount: 2,
        publishedAt: new Date('2026-03-27T09:00:00.000Z')
      })
    );
    const publisher = createPublisherMock();
    const service = new RequestService(repository, publisher);

    await expect(
      service.updateRequest(buyer, 'req-1', {
        title: 'Completely different request'
      })
    ).rejects.toThrow('Published requests with offers can only update');
  });

  it('does not allow cancelling an accepted request', async () => {
    const repository = createRepositoryMock(
      makeRequest({
        status: 'accepted',
        publishedAt: new Date('2026-03-27T09:00:00.000Z')
      })
    );
    const publisher = createPublisherMock();
    const service = new RequestService(repository, publisher);

    await expect(service.cancelRequest(buyer, 'req-1')).rejects.toThrow(
      'Invalid request status transition from "accepted" to "cancelled"'
    );
  });
});
