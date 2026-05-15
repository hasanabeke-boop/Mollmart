-- AlterTable
ALTER TABLE "User" ADD COLUMN "canBuy" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "canSell" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "recommendationsOnboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "recommendationsOnboardingSkippedAt" TIMESTAMP(3);

UPDATE "User" SET "canBuy" = true, "canSell" = false WHERE "role" = 'buyer';
UPDATE "User" SET "canBuy" = false, "canSell" = true WHERE "role" = 'seller';
UPDATE "User" SET "canBuy" = true, "canSell" = true WHERE "role" = 'admin';
