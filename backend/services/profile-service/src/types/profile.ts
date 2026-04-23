import { Prisma, UserRole, VerificationStatus } from '@prisma/client';

export interface UpdateUserProfileInput {
  fullName?: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
}

export interface UpdateSellerProfileInput {
  displayName?: string;
  description?: string;
  businessType?: string;
  website?: string;
  instagramUrl?: string;
}

export interface UpdateBuyerProfileInput {
  displayName?: string;
  city?: string;
  preferencesJson?: Prisma.InputJsonValue | null;
}

export interface SellerListQuery {
  city?: string;
  businessType?: string;
  verificationStatus?: VerificationStatus;
  page: number;
  limit: number;
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

export interface BaseProfileContext {
  userId: string;
  role: UserRole;
}
