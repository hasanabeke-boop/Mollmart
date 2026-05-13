import {
  BuyerProfile,
  Prisma,
  PrismaClient,
  SellerProfile,
  UserProfile,
  VerificationStatus
} from '@prisma/client';
import prisma from '../../../config/prisma';
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
  upsertSellerProfile(userId: string, data: Partial<Pick<SellerProfile, 'displayName' | 'description' | 'businessType' | 'website' | 'instagramUrl' | 'preferencesJson'>>): Promise<FullProfile>;
  upsertBuyerProfile(userId: string, data: Partial<Pick<BuyerProfile, 'displayName' | 'city' | 'preferencesJson'>>): Promise<FullProfile>;
  listPublicSellers(query: SellerListQuery): Promise<RequestListResult<FullProfile>>;
}

async function defaultDisplayLabel(tx: Prisma.TransactionClient, userId: string): Promise<string> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  const label = (user?.name ?? '').trim();
  return label.length > 0 ? label : 'User';
}

export class ProfileRepository implements ProfileRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async ensureBaseProfile(input: EnsureProfileInput): Promise<FullProfile> {
    return this.client.$transaction(async (tx) => {
      const displayLabel = await defaultDisplayLabel(tx, input.userId);

      const existing = await tx.userProfile.findUnique({
        where: { userId: input.userId },
        include: profileInclude
      });

      if (existing != null) {
        const data: Prisma.UserProfileUpdateInput = {};

        if (existing.fullName === existing.userId) {
          data.fullName = displayLabel;
        }
        if (existing.sellerProfile != null && existing.sellerProfile.displayName === existing.userId) {
          data.sellerProfile = { update: { displayName: displayLabel } };
        }
        if (existing.buyerProfile != null && existing.buyerProfile.displayName === existing.userId) {
          data.buyerProfile = { update: { displayName: displayLabel } };
        }

        if (Object.keys(data).length > 0) {
          return tx.userProfile.update({
            where: { userId: input.userId },
            data,
            include: profileInclude
          });
        }

        return existing;
      }

      const created = await tx.userProfile.create({
        data: {
          userId: input.userId,
          role: input.role,
          fullName: displayLabel,
          ...(input.role === 'seller'
            ? {
                sellerProfile: {
                  create: {
                    displayName: displayLabel,
                    verificationStatus: VerificationStatus.unverified
                  }
                }
              }
            : {}),
          ...(input.role === 'buyer'
            ? {
                buyerProfile: {
                  create: {
                    displayName: displayLabel
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
    data: Partial<Pick<SellerProfile, 'displayName' | 'description' | 'businessType' | 'website' | 'instagramUrl' | 'preferencesJson'>>
  ): Promise<FullProfile> {
    const preferencesJson =
      data.preferencesJson === undefined
        ? undefined
        : data.preferencesJson === null
          ? Prisma.JsonNull
          : (data.preferencesJson as Prisma.InputJsonValue);

    return this.client.$transaction(async (tx) => {
      const fallbackName =
        data.displayName != null && data.displayName.trim().length > 0
          ? data.displayName.trim()
          : await defaultDisplayLabel(tx, userId);

      await tx.sellerProfile.upsert({
        where: { userId },
        update: {
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
          ...(data.website !== undefined ? { website: data.website } : {}),
          ...(data.instagramUrl !== undefined ? { instagramUrl: data.instagramUrl } : {}),
          ...(preferencesJson !== undefined ? { preferencesJson } : {})
        },
        create: {
          userId,
          displayName: fallbackName,
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
          ...(data.website !== undefined ? { website: data.website } : {}),
          ...(data.instagramUrl !== undefined ? { instagramUrl: data.instagramUrl } : {}),
          ...(preferencesJson !== undefined ? { preferencesJson } : {})
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
    const preferencesJson =
      data.preferencesJson === undefined
        ? undefined
        : data.preferencesJson === null
          ? Prisma.JsonNull
          : (data.preferencesJson as Prisma.InputJsonValue);

    return this.client.$transaction(async (tx) => {
      const fallbackName =
        data.displayName != null && data.displayName.trim().length > 0
          ? data.displayName.trim()
          : await defaultDisplayLabel(tx, userId);

      await tx.buyerProfile.upsert({
        where: { userId },
        update: {
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(preferencesJson !== undefined ? { preferencesJson } : {})
        },
        create: {
          userId,
          displayName: fallbackName,
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(preferencesJson !== undefined ? { preferencesJson } : {})
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
