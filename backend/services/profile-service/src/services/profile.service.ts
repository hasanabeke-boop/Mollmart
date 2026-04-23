import { Prisma } from '@prisma/client';
import { AuthUser } from '../types/express';
import {
  SellerListQuery,
  UpdateBuyerProfileInput,
  UpdateSellerProfileInput,
  UpdateUserProfileInput
} from '../types/profile';
import { forbidden, notFound } from '../utils/apiError';
import { FullProfile, ProfileRepositoryLike } from '../repositories/profile.repository';
import { ProfileEventPublisherLike } from './profile-event.service';

export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepositoryLike,
    private readonly profileEventPublisher: ProfileEventPublisherLike
  ) {}

  async getMyProfile(user: AuthUser) {
    const profile = await this.profileRepository.ensureBaseProfile({
      userId: user.id,
      role: user.role
    });

    return this.toPrivateProfile(profile);
  }

  async updateMyProfile(user: AuthUser, input: UpdateUserProfileInput) {
    await this.profileRepository.ensureBaseProfile({
      userId: user.id,
      role: user.role
    });

    const updated = await this.profileRepository.updateBaseProfile(user.id, this.mapBaseUpdateInput(input));
    await this.profileEventPublisher.publishProfileUpdated(updated);
    return this.toPrivateProfile(updated);
  }

  async updateMySellerProfile(user: AuthUser, input: UpdateSellerProfileInput) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers and admins can update seller profile details');
    }

    await this.profileRepository.ensureBaseProfile({
      userId: user.id,
      role: user.role
    });

    const updated = await this.profileRepository.upsertSellerProfile(user.id, this.mapSellerUpdateInput(input));
    await this.profileEventPublisher.publishSellerProfileUpdated(updated);
    return this.toPrivateProfile(updated);
  }

  async updateMyBuyerProfile(user: AuthUser, input: UpdateBuyerProfileInput) {
    if (user.role !== 'buyer' && user.role !== 'admin') {
      throw forbidden('Only buyers and admins can update buyer profile details');
    }

    await this.profileRepository.ensureBaseProfile({
      userId: user.id,
      role: user.role
    });

    const updated = await this.profileRepository.upsertBuyerProfile(user.id, this.mapBuyerUpdateInput(input));
    await this.profileEventPublisher.publishBuyerProfileUpdated(updated);
    return this.toPrivateProfile(updated);
  }

  async getPublicSellerProfile(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (profile == null || profile.role !== 'seller' || profile.sellerProfile == null) {
      throw notFound('Seller profile not found');
    }

    return this.toPublicSellerProfile(profile);
  }

  async getBuyerProfile(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (profile == null || profile.role !== 'buyer') {
      throw notFound('Buyer profile not found');
    }

    return this.toBuyerProfile(profile);
  }

  async listPublicSellerProfiles(query: SellerListQuery) {
    const result = await this.profileRepository.listPublicSellers(query);

    return {
      items: result.items.map((profile) => this.toPublicSellerProfile(profile)),
      meta: result.meta
    };
  }

  private toPrivateProfile(profile: FullProfile) {
    return {
      userId: profile.userId,
      role: profile.role,
      fullName: profile.fullName,
      phone: profile.phone,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      sellerProfile:
        profile.sellerProfile == null
          ? null
          : {
              displayName: profile.sellerProfile.displayName,
              description: profile.sellerProfile.description,
              businessType: profile.sellerProfile.businessType,
              website: profile.sellerProfile.website,
              instagramUrl: profile.sellerProfile.instagramUrl,
              verificationStatus: profile.sellerProfile.verificationStatus,
              ratingAverage: Number(profile.sellerProfile.ratingAverage),
              completedDealsCount: profile.sellerProfile.completedDealsCount
            },
      buyerProfile:
        profile.buyerProfile == null
          ? null
          : {
              displayName: profile.buyerProfile.displayName,
              city: profile.buyerProfile.city,
              preferencesJson: profile.buyerProfile.preferencesJson
            }
    };
  }

  private toPublicSellerProfile(profile: FullProfile) {
    if (profile.sellerProfile == null) {
      throw notFound('Seller profile not found');
    }

    return {
      userId: profile.userId,
      fullName: profile.fullName,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      sellerProfile: {
        displayName: profile.sellerProfile.displayName,
        description: profile.sellerProfile.description,
        businessType: profile.sellerProfile.businessType,
        website: profile.sellerProfile.website,
        instagramUrl: profile.sellerProfile.instagramUrl,
        verificationStatus: profile.sellerProfile.verificationStatus,
        ratingAverage: Number(profile.sellerProfile.ratingAverage),
        completedDealsCount: profile.sellerProfile.completedDealsCount
      }
    };
  }

  private toBuyerProfile(profile: FullProfile) {
    return {
      userId: profile.userId,
      fullName: profile.fullName,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      buyerProfile:
        profile.buyerProfile == null
          ? null
          : {
              displayName: profile.buyerProfile.displayName,
              city: profile.buyerProfile.city
            }
    };
  }

  private mapBaseUpdateInput(input: UpdateUserProfileInput): Partial<Pick<FullProfile, 'fullName' | 'phone' | 'city' | 'avatarUrl'>> {
    const data: Partial<Pick<FullProfile, 'fullName' | 'phone' | 'city' | 'avatarUrl'>> = {};

    if (input.fullName !== undefined) {
      data.fullName = input.fullName.trim();
    }
    if (input.phone !== undefined) {
      data.phone = input.phone.trim().length > 0 ? input.phone.trim() : null;
    }
    if (input.city !== undefined) {
      data.city = input.city.trim().length > 0 ? input.city.trim() : null;
    }
    if (input.avatarUrl !== undefined) {
      data.avatarUrl = input.avatarUrl.trim().length > 0 ? input.avatarUrl.trim() : null;
    }

    return data;
  }

  private mapSellerUpdateInput(input: UpdateSellerProfileInput) {
    const data: Partial<{
      displayName: string;
      description: string | null;
      businessType: string | null;
      website: string | null;
      instagramUrl: string | null;
    }> = {};

    if (input.displayName !== undefined) {
      data.displayName = input.displayName.trim();
    }
    if (input.description !== undefined) {
      data.description = input.description.trim().length > 0 ? input.description.trim() : null;
    }
    if (input.businessType !== undefined) {
      data.businessType = input.businessType.trim().length > 0 ? input.businessType.trim() : null;
    }
    if (input.website !== undefined) {
      data.website = input.website.trim().length > 0 ? input.website.trim() : null;
    }
    if (input.instagramUrl !== undefined) {
      data.instagramUrl = input.instagramUrl.trim().length > 0 ? input.instagramUrl.trim() : null;
    }

    return data;
  }

  private mapBuyerUpdateInput(input: UpdateBuyerProfileInput) {
    const data: Partial<{
      displayName: string;
      city: string | null;
      preferencesJson: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }> = {};

    if (input.displayName !== undefined) {
      data.displayName = input.displayName.trim();
    }
    if (input.city !== undefined) {
      data.city = input.city.trim().length > 0 ? input.city.trim() : null;
    }
    if (input.preferencesJson !== undefined) {
      data.preferencesJson = input.preferencesJson === null ? Prisma.JsonNull : input.preferencesJson;
    }

    return data;
  }
}

export default ProfileService;
