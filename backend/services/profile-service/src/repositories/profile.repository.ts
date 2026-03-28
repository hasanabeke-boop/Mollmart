import {
  BuyerProfile,
  Prisma,
  PrismaClient,
  SellerProfile,
  UserProfile,
  VerificationStatus
} from '@prisma/client';
import prisma from '../config/prisma';
import { RequestListResult, SellerListQuery } from '../types/profile';
import { buildPageMeta } from '../utils/pagination';

const profileInclude = {
  sellerProfile: true,
  buyerProfile: true
} satisfies Prisma.UserProfileInclude;

export type FullProfile = UserProfile & {
  sellerProfile: SellerProfile | null;
  buyerProfile: BuyerProfile | null;
};

export interface EnsureProfileInput {
  userId: string;
  role: 'buyer' | 'seller' | 'admin';
}

export interface ProfileRepositoryLike {
  ensureBaseProfile(input: EnsureProfileInput): Promise<FullProfile>;
  findByUserId(userId: string): Promise<FullProfile | null>;
  updateBaseProfile(userId: string, data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'city' | 'avatarUrl'>>): Promise<FullProfile>;
  upsertSellerProfile(userId: string, data: Partial<Pick<SellerProfile, 'displayName' | 'description' | 'businessType' | 'website' | 'instagramUrl'>>): Promise<FullProfile>;
  upsertBuyerProfile(userId: string, data: Partial<Pick<BuyerProfile, 'displayName' | 'city' | 'preferencesJson'>>): Promise<FullProfile>;
  listPublicSellers(query: SellerListQuery): Promise<RequestListResult<FullProfile>>;
}

export class ProfileRepository implements ProfileRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async ensureBaseProfile(input: EnsureProfileInput): Promise<FullProfile> {
    return this.client.$transaction(async (tx) => {
      const existing = await tx.userProfile.findUnique({
        where: { userId: input.userId },
        include: profileInclude
      });

      if (existing != null) {
        return existing;
      }

      const created = await tx.userProfile.create({
        data: {
          userId: input.userId,
          role: input.role,
          fullName: input.userId,
          ...(input.role === 'seller'
            ? {
                sellerProfile: {
                  create: {
                    displayName: input.userId,
                    verificationStatus: VerificationStatus.unverified
                  }
                }
              }
            : {}),
          ...(input.role === 'buyer'
            ? {
                buyerProfile: {
                  create: {
                    displayName: input.userId
                  }
                }
              }
            : {})
        },
        include: profileInclude
      });

      return created;
    });
  }

  async findByUserId(userId: string): Promise<FullProfile | null> {
    return this.client.userProfile.findUnique({
      where: { userId },
      include: profileInclude
    });
  }

  async updateBaseProfile(
    userId: string,
    data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'city' | 'avatarUrl'>>
  ): Promise<FullProfile> {
    return this.client.userProfile.update({
      where: { userId },
      data,
      include: profileInclude
    });
  }

  async upsertSellerProfile(
    userId: string,
    data: Partial<Pick<SellerProfile, 'displayName' | 'description' | 'businessType' | 'website' | 'instagramUrl'>>
  ): Promise<FullProfile> {
    return this.client.$transaction(async (tx) => {
      await tx.sellerProfile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          displayName: data.displayName ?? userId,
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
          ...(data.website !== undefined ? { website: data.website } : {}),
          ...(data.instagramUrl !== undefined ? { instagramUrl: data.instagramUrl } : {})
        }
      });

      return tx.userProfile.findUniqueOrThrow({
        where: { userId },
        include: profileInclude
      });
    });
  }

  async upsertBuyerProfile(
    userId: string,
    data: Partial<Pick<BuyerProfile, 'displayName' | 'city' | 'preferencesJson'>>
  ): Promise<FullProfile> {
    return this.client.$transaction(async (tx) => {
      await tx.buyerProfile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          displayName: data.displayName ?? userId,
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.preferencesJson !== undefined ? { preferencesJson: data.preferencesJson } : {})
        }
      });

      return tx.userProfile.findUniqueOrThrow({
        where: { userId },
        include: profileInclude
      });
    });
  }

  async listPublicSellers(query: SellerListQuery): Promise<RequestListResult<FullProfile>> {
    const where: Prisma.UserProfileWhereInput = {
      role: 'seller',
      sellerProfile: {
        is: {
          ...(query.businessType !== undefined ? { businessType: query.businessType } : {}),
          ...(query.verificationStatus !== undefined ? { verificationStatus: query.verificationStatus } : {})
        }
      },
      ...(query.city !== undefined ? { city: { contains: query.city, mode: 'insensitive' } } : {})
    };

    const [items, total] = await Promise.all([
      this.client.userProfile.findMany({
        where,
        include: profileInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      this.client.userProfile.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(query.page, query.limit, total)
    };
  }
}

export default ProfileRepository;
