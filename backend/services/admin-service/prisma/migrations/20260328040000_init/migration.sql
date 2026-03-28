CREATE TYPE "ModerationTargetType" AS ENUM (
  'request',
  'offer',
  'user'
);

CREATE TYPE "ModerationCaseStatus" AS ENUM (
  'open',
  'in_review',
  'resolved',
  'dismissed'
);

CREATE TYPE "ModerationActionType" AS ENUM (
  'note',
  'hide_content',
  'unhide_content',
  'block_user',
  'unblock_user',
  'resolve_case'
);

CREATE TYPE "ContentFlagStatus" AS ENUM (
  'active',
  'hidden',
  'cleared'
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationCase" (
  "id" TEXT NOT NULL,
  "targetType" "ModerationTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ModerationCaseStatus" NOT NULL DEFAULT 'open',
  "createdBy" TEXT NOT NULL,
  "assignedTo" TEXT,
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationAction" (
  "id" TEXT NOT NULL,
  "moderationCaseId" TEXT NOT NULL,
  "actionType" "ModerationActionType" NOT NULL,
  "actorId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlockedUser" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "blockedBy" TEXT NOT NULL,
  "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unblockedAt" TIMESTAMP(3),
  CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentFlag" (
  "id" TEXT NOT NULL,
  "targetType" "ModerationTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ContentFlagStatus" NOT NULL DEFAULT 'active',
  "createdBy" TEXT NOT NULL,
  "hiddenBy" TEXT,
  "hiddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_isActive_createdAt_idx" ON "Category"("isActive", "createdAt" DESC);
CREATE INDEX "ModerationCase_targetType_targetId_idx" ON "ModerationCase"("targetType", "targetId");
CREATE INDEX "ModerationCase_status_createdAt_idx" ON "ModerationCase"("status", "createdAt" DESC);
CREATE INDEX "ModerationAction_moderationCaseId_createdAt_idx" ON "ModerationAction"("moderationCaseId", "createdAt" DESC);
CREATE UNIQUE INDEX "BlockedUser_userId_key" ON "BlockedUser"("userId");
CREATE INDEX "ContentFlag_targetType_targetId_idx" ON "ContentFlag"("targetType", "targetId");
CREATE INDEX "ContentFlag_status_createdAt_idx" ON "ContentFlag"("status", "createdAt" DESC);

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModerationAction"
  ADD CONSTRAINT "ModerationAction_moderationCaseId_fkey"
  FOREIGN KEY ("moderationCaseId") REFERENCES "ModerationCase"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
