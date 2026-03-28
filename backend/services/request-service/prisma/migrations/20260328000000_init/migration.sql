CREATE TYPE "RequestStatus" AS ENUM (
  'draft',
  'published',
  'has_offers',
  'in_negotiation',
  'accepted',
  'closed',
  'cancelled'
);

CREATE TYPE "RequestStatusHistoryAction" AS ENUM (
  'created',
  'updated',
  'published',
  'moved_to_has_offers',
  'moved_to_negotiation',
  'accepted',
  'closed',
  'cancelled'
);

CREATE TABLE "Request" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "budgetMin" DECIMAL(12,2),
  "budgetMax" DECIMAL(12,2),
  "currency" VARCHAR(3) NOT NULL,
  "location" TEXT,
  "deadlineAt" TIMESTAMP(3),
  "status" "RequestStatus" NOT NULL DEFAULT 'draft',
  "offerCount" INTEGER NOT NULL DEFAULT 0,
  "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequestAttachment" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequestStatusHistory" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "fromStatus" "RequestStatus",
  "toStatus" "RequestStatus" NOT NULL,
  "action" "RequestStatusHistoryAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Request_buyerId_createdAt_idx" ON "Request"("buyerId", "createdAt" DESC);
CREATE INDEX "Request_status_publishedAt_idx" ON "Request"("status", "publishedAt" DESC);
CREATE INDEX "Request_categoryId_status_idx" ON "Request"("categoryId", "status");
CREATE INDEX "Request_deadlineAt_idx" ON "Request"("deadlineAt");
CREATE INDEX "RequestAttachment_requestId_idx" ON "RequestAttachment"("requestId");
CREATE INDEX "RequestStatusHistory_requestId_createdAt_idx" ON "RequestStatusHistory"("requestId", "createdAt" DESC);

ALTER TABLE "RequestAttachment"
  ADD CONSTRAINT "RequestAttachment_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "Request"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestStatusHistory"
  ADD CONSTRAINT "RequestStatusHistory_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "Request"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
