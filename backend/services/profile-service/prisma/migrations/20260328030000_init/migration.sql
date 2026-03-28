CREATE TYPE "UserRole" AS ENUM (
  'buyer',
  'seller',
  'admin'
);

CREATE TYPE "VerificationStatus" AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "city" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "businessType" TEXT,
  "website" TEXT,
  "instagramUrl" TEXT,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'unverified',
  "ratingAverage" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "completedDealsCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BuyerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "city" TEXT,
  "preferencesJson" JSONB,
  CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE INDEX "UserProfile_role_createdAt_idx" ON "UserProfile"("role", "createdAt" DESC);
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");
CREATE INDEX "SellerProfile_verificationStatus_ratingAverage_idx" ON "SellerProfile"("verificationStatus", "ratingAverage" DESC);
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "BuyerProfile"("userId");

ALTER TABLE "SellerProfile"
  ADD CONSTRAINT "SellerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuyerProfile"
  ADD CONSTRAINT "BuyerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId")
  ON DELETE CASCADE ON UPDATE CASCADE;
