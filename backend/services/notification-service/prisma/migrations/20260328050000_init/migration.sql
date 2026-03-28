CREATE TYPE "NotificationType" AS ENUM (
  'request_published',
  'offer_created',
  'offer_accepted',
  'chat_message_created',
  'user_blocked',
  'moderation_case_created'
);

CREATE TYPE "NotificationReferenceType" AS ENUM (
  'request',
  'offer',
  'conversation',
  'user',
  'moderation_case'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "referenceType" "NotificationReferenceType" NOT NULL,
  "referenceId" TEXT NOT NULL,
  "dedupeKey" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);
