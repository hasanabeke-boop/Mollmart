CREATE TYPE "UserRole" AS ENUM ('buyer', 'seller', 'admin');

CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked', 'suspended');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'buyer',
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);
