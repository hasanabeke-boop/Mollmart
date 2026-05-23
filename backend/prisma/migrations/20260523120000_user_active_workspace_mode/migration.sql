CREATE TYPE "WorkspaceMode" AS ENUM ('buyer', 'seller');

ALTER TABLE "User" ADD COLUMN "activeWorkspaceMode" "WorkspaceMode" NOT NULL DEFAULT 'buyer';

UPDATE "User" SET "activeWorkspaceMode" = 'seller' WHERE "canSell" = true AND "canBuy" = false;
