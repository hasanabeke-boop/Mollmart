import OfferService from '../../src/services/offer.service';
import { AuthUser } from '../../src/types/express';
import { OfferRepositoryLike, OfferWithRelations } from '../../src/repositories/offer.repository';
import { OfferEventPublisherLike } from '../../src/services/offer-event.service';
import { RequestServiceClientLike } from '../../src/services/request-service.client';

function makeOffer(overrides?: Partial<OfferWithRelations>): OfferWithRelations {
  const now = new Date('2026-03-28T09:00:00.000Z');

  return {
    id: 'offer-1',
    requestId: 'request-1',
    sellerId: 'seller-1',
    price: 1500 as never,
    currency: 'USD',
    message: 'Competitive offer',
    deliveryDays: 7,
    warrantyInfo: '12 months',
    status: 'submitted',
    createdAt: now,
    updatedAt: now,
    acceptedAt: null,
    withdrawnAt: null,
    statusHistory: [],
    ...overrides
  };
}

function createRepositoryMock(initialOffer: OfferWithRelations): jest.Mocked<OfferRepositoryLike> {
  let current = initialOffer;

  return {
    create: jest.fn(async (data) =>
      makeOffer({
        requestId: data.requestId,
        sellerId: data.sellerId,
        price: data.price as never,
        currency: data.currency,
        message: data.message,
        deliveryDays: data.deliveryDays,
        warrantyInfo: data.warrantyInfo
      })
    ),
    findById: jest.fn(async () => current),
    findAcceptedByRequest: jest.fn(async () => null),
    findActiveByRequestAndSeller: jest.fn(async () => null),
    update: jest.fn(async (_id, data) => {
      current = makeOffer({
        ...current,
        ...data,
        status: 'updated'
      });
      return current;
    }),
    transitionStatus: jest.fn(async (_id, toStatus) => {
      current = makeOffer({
        ...current,
        status: toStatus
      });
      return current;
    }),
    acceptOffer: jest.fn(async () => ({
      acceptedOffer: makeOffer({
        ...current,
        status: 'accepted',
        acceptedAt: new Date('2026-03-28T10:00:00.000Z')
      }),
      rejectedOffers: [
        makeOffer({
          id: 'offer-2',
          sellerId: 'seller-2',
          status: 'rejected'
        })
      ]
    })),
    listSellerOffers: jest.fn(),
    listByRequest: jest.fn()
  };
}

function createPublisherMock(): jest.Mocked<OfferEventPublisherLike> {
  return {
    publishOfferCreated: jest.fn(async () => undefined),
    publishOfferUpdated: jest.fn(async () => undefined),
    publishOfferWithdrawn: jest.fn(async () => undefined),
    publishOfferAccepted: jest.fn(async () => undefined),
    publishOfferRejected: jest.fn(async () => undefined)
  };
}

function createRequestClientMock(
  buyerId = 'buyer-1'
): jest.Mocked<RequestServiceClientLike> {
  return {
    getRequestById: jest.fn(async () => ({
      id: 'request-1',
      buyerId,
      status: 'published',
      deadlineAt: '2026-04-20T00:00:00.000Z'
    }))
  };
}

describe('OfferService', () => {
  const seller: AuthUser = { id: 'seller-1', role: 'seller' };
  const buyer: AuthUser = { id: 'buyer-1', role: 'buyer' };

  it('allows only sellers to create offers', async () => {
    const service = new OfferService(
      createRepositoryMock(makeOffer()),
      createPublisherMock(),
      createRequestClientMock()
    );

    await expect(
      service.createOffer(buyer, {
        requestId: 'request-1',
        price: 1200,
        currency: 'USD',
        message: 'Bid'
      })
    ).rejects.toThrow('Only sellers can create offers');
  });

  it('prevents duplicate active offers for the same seller and request', async () => {
    const repository = createRepositoryMock(makeOffer());
    repository.findActiveByRequestAndSeller.mockResolvedValue(makeOffer());

    const service = new OfferService(repository, createPublisherMock(), createRequestClientMock());

    await expect(
      service.createOffer(seller, {
        requestId: 'request-1',
        price: 1200,
        currency: 'USD',
        message: 'Bid'
      })
    ).rejects.toThrow('Seller already has an active offer for this request');
  });

  it('accepts one offer and rejects competing active offers', async () => {
    const repository = createRepositoryMock(makeOffer());
    const publisher = createPublisherMock();
    const service = new OfferService(repository, publisher, createRequestClientMock());

    const result = await service.acceptOffer(buyer, 'offer-1');

    expect(result.status).toBe('accepted');
    expect(repository.acceptOffer).toHaveBeenCalledWith('offer-1', 'buyer-1');
    expect(publisher.publishOfferAccepted).toHaveBeenCalledTimes(1);
    expect(publisher.publishOfferRejected).toHaveBeenCalledTimes(1);
  });

  it('returns existing accepted offer on repeated accept call', async () => {
    const acceptedOffer = makeOffer({
      status: 'accepted',
      acceptedAt: new Date('2026-03-28T10:00:00.000Z')
    });
    const repository = createRepositoryMock(acceptedOffer);
    repository.findAcceptedByRequest.mockResolvedValue(acceptedOffer);

    const service = new OfferService(repository, createPublisherMock(), createRequestClientMock());

    const result = await service.acceptOffer(buyer, 'offer-1');

    expect(result.id).toBe('offer-1');
    expect(repository.acceptOffer).not.toHaveBeenCalled();
  });

  it('does not allow sellers to accept offers', async () => {
    const service = new OfferService(
      createRepositoryMock(makeOffer()),
      createPublisherMock(),
      createRequestClientMock()
    );

    await expect(service.acceptOffer(seller, 'offer-1')).rejects.toThrow('Only buyers can accept offers');
  });
});
