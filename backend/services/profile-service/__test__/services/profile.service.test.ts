import { VerificationStatus } from '@prisma/client';
import ProfileService from '../../src/services/profile.service';
import { ProfileRepositoryLike } from '../../src/repositories/profile.repository';
import { ProfileEventPublisherLike } from '../../src/services/profile-event.service';
import { AuthUser } from '../../src/types/express';

function makeFullProfile(overrides?: Record<string, unknown>) {
  const now = new Date('2026-03-28T09:00:00.000Z');

  return {
    id: 'profile-1',
    userId: 'seller-1',
    role: 'seller',
    fullName: 'Seller One',
    phone: '+77010000000',
    city: 'Almaty',
    avatarUrl: 'https://images.example.com/seller-1.png',
    createdAt: now,
    updatedAt: now,
    sellerProfile: {
      id: 'seller-profile-1',
      userId: 'seller-1',
      displayName: 'Seller One Store',
      description: 'Marketplace seller',
      businessType: 'llp',
      website: 'https://seller-one.example.com',
      instagramUrl: 'https://instagram.com/sellerone',
      verificationStatus: VerificationStatus.verified,
      ratingAverage: 4.7 as never,
      completedDealsCount: 12
    },
    buyerProfile: null,
    ...overrides
  };
}

function createRepositoryMock(profile = makeFullProfile()): jest.Mocked<ProfileRepositoryLike> {
  return {
    ensureBaseProfile: jest.fn(async () => profile as never),
    findByUserId: jest.fn(async () => profile as never),
    updateBaseProfile: jest.fn(async () => profile as never),
    upsertSellerProfile: jest.fn(async () => profile as never),
    upsertBuyerProfile: jest.fn(async () => profile as never),
    listPublicSellers: jest.fn(async () => ({
      items: [profile as never],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    }))
  };
}

function createEventPublisherMock(): jest.Mocked<ProfileEventPublisherLike> {
  return {
    publishProfileUpdated: jest.fn(async () => undefined),
    publishSellerProfileUpdated: jest.fn(async () => undefined),
    publishBuyerProfileUpdated: jest.fn(async () => undefined)
  };
}

describe('ProfileService', () => {
  const seller: AuthUser = { id: 'seller-1', role: 'seller' };
  const buyer: AuthUser = { id: 'buyer-1', role: 'buyer' };

  it('returns the current user profile', async () => {
    const service = new ProfileService(createRepositoryMock(), createEventPublisherMock());

    const result = await service.getMyProfile(seller);

    expect(result.userId).toBe('seller-1');
    expect(result.sellerProfile?.displayName).toBe('Seller One Store');
  });

  it('returns public seller data without private phone field', async () => {
    const service = new ProfileService(createRepositoryMock(), createEventPublisherMock());

    const result = await service.getPublicSellerProfile('seller-1');

    expect(result.userId).toBe('seller-1');
    expect('phone' in result).toBe(false);
    expect(result.sellerProfile.verificationStatus).toBe('verified');
  });

  it('blocks buyers from updating seller profile details', async () => {
    const service = new ProfileService(createRepositoryMock(), createEventPublisherMock());

    await expect(
      service.updateMySellerProfile(buyer, {
        displayName: 'Should fail'
      })
    ).rejects.toThrow('Only sellers and admins can update seller profile details');
  });

  it('allows buyers to update buyer-specific details', async () => {
    const buyerProfile = makeFullProfile({
      userId: 'buyer-1',
      role: 'buyer',
      sellerProfile: null,
      buyerProfile: {
        id: 'buyer-profile-1',
        userId: 'buyer-1',
        displayName: 'Buyer One',
        city: 'Astana',
        preferencesJson: { preferredCurrency: 'USD' }
      }
    });
    const repository = createRepositoryMock(buyerProfile);
    const events = createEventPublisherMock();
    const service = new ProfileService(repository, events);

    const result = await service.updateMyBuyerProfile(buyer, {
      displayName: 'Buyer Updated'
    });

    expect(repository.upsertBuyerProfile).toHaveBeenCalled();
    expect(events.publishBuyerProfileUpdated).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe('buyer-1');
  });
});
