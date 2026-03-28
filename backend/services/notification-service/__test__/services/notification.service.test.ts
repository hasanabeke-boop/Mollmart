import NotificationService from '../../src/services/notification.service';
import NotificationEventMapper from '../../src/services/notification-event-mapper.service';
import { NotificationRepositoryLike } from '../../src/repositories/notification.repository';
import { AuthUser } from '../../src/types/express';

function createRepositoryMock(): jest.Mocked<NotificationRepositoryLike> {
  return {
    createIfNotExists: jest.fn(async () => ({
      id: 'notif-1',
      userId: 'buyer-1',
      type: 'offer_created',
      title: 'New offer',
      body: 'A new offer arrived',
      referenceType: 'offer',
      referenceId: 'offer-1',
      dedupeKey: 'offer-created-offer-1-buyer-1',
      isRead: false,
      createdAt: new Date(),
      readAt: null
    })),
    listForUser: jest.fn(async () => []),
    markRead: jest.fn(async () => ({
      id: 'notif-1',
      userId: 'buyer-1',
      type: 'offer_created',
      title: 'New offer',
      body: 'A new offer arrived',
      referenceType: 'offer',
      referenceId: 'offer-1',
      dedupeKey: 'offer-created-offer-1-buyer-1',
      isRead: true,
      createdAt: new Date(),
      readAt: new Date()
    })),
    markAllRead: jest.fn(async () => 3)
  };
}

describe('Notification event mapping', () => {
  it('maps offer.created to buyer notification', () => {
    const mapper = new NotificationEventMapper();

    const result = mapper.mapEvent({
      channel: 'offer.created',
      payload: {
        offerId: 'offer-1',
        buyerId: 'buyer-1'
      }
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.userId).toBe('buyer-1');
    expect(result[0]?.type).toBe('offer_created');
  });

  it('skips malformed events safely', () => {
    const mapper = new NotificationEventMapper();

    const result = mapper.mapEvent({
      channel: 'offer.created',
      payload: {
        offerId: 'offer-1'
      }
    });

    expect(result).toEqual([]);
  });
});

describe('NotificationService', () => {
  const user: AuthUser = { id: 'buyer-1', role: 'buyer' };

  it('marks one notification as read', async () => {
    const repository = createRepositoryMock();
    const service = new NotificationService(repository);

    const result = await service.markNotificationRead(user, 'notif-1');

    expect(repository.markRead).toHaveBeenCalledWith('buyer-1', 'notif-1');
    expect(result.isRead).toBe(true);
  });

  it('marks all notifications as read', async () => {
    const repository = createRepositoryMock();
    const service = new NotificationService(repository);

    const result = await service.markAllRead(user);

    expect(result.updatedCount).toBe(3);
    expect(repository.markAllRead).toHaveBeenCalledWith('buyer-1');
  });
});
