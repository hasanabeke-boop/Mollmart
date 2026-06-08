-- CreateEnum
CREATE TYPE "AuctionSessionStatus" AS ENUM ('gathering', 'scheduled', 'live', 'ended', 'cancelled', 'no_winner');

-- CreateEnum
CREATE TYPE "AuctionParticipantStatus" AS ENUM ('registered', 'active', 'withdrawn', 'winner', 'eliminated');

-- CreateTable
CREATE TABLE "AuctionSession" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "AuctionSessionStatus" NOT NULL DEFAULT 'gathering',
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "roundEndsAt" TIMESTAMP(3),
    "roundPausedUntil" TIMESTAMP(3),
    "leaderSellerId" TEXT,
    "leaderPrice" DECIMAL(12,2),
    "winnerSellerId" TEXT,
    "winningPrice" DECIMAL(12,2),
    "consecutiveNoBidRounds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "startPrice" DECIMAL(12,2) NOT NULL,
    "floorPrice" DECIMAL(12,2) NOT NULL,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "deliveryDays" INTEGER,
    "message" TEXT,
    "status" "AuctionParticipantStatus" NOT NULL DEFAULT 'registered',
    "inactiveRounds" INTEGER NOT NULL DEFAULT 0,
    "actedThisRound" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "AuctionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionBidEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "priceBefore" DECIMAL(12,2) NOT NULL,
    "priceAfter" DECIMAL(12,2) NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBidEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionSession_requestId_key" ON "AuctionSession"("requestId");

-- CreateIndex
CREATE INDEX "AuctionSession_status_scheduledAt_idx" ON "AuctionSession"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "AuctionSession_status_roundEndsAt_idx" ON "AuctionSession"("status", "roundEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionParticipant_sessionId_sellerId_key" ON "AuctionParticipant"("sessionId", "sellerId");

-- CreateIndex
CREATE INDEX "AuctionParticipant_sellerId_status_idx" ON "AuctionParticipant"("sellerId", "status");

-- CreateIndex
CREATE INDEX "AuctionParticipant_sessionId_status_idx" ON "AuctionParticipant"("sessionId", "status");

-- CreateIndex
CREATE INDEX "AuctionBidEvent_sessionId_createdAt_idx" ON "AuctionBidEvent"("sessionId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AuctionSession" ADD CONSTRAINT "AuctionSession_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuctionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBidEvent" ADD CONSTRAINT "AuctionBidEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuctionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
