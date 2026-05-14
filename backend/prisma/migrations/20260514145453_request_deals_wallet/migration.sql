-- CreateEnum
CREATE TYPE "PriceProposalStatus" AS ENUM ('pending', 'accepted', 'declined', 'superseded');

-- AlterEnum
ALTER TYPE "NotificationReferenceType" ADD VALUE 'request_deal_order';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'request_deal_paid';
ALTER TYPE "NotificationType" ADD VALUE 'request_deal_status_changed';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "agreedAt" TIMESTAMP(3),
ADD COLUMN     "agreedCurrency" VARCHAR(3),
ADD COLUMN     "agreedPrice" DECIMAL(12,2),
ADD COLUMN     "agreedProposalId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletBalance" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PriceProposal" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PriceProposalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestDealOrder" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "CatalogOrderStatus" NOT NULL DEFAULT 'processing',
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestDealOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceProposal_conversationId_createdAt_idx" ON "PriceProposal"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PriceProposal_proposerId_idx" ON "PriceProposal"("proposerId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestDealOrder_conversationId_key" ON "RequestDealOrder"("conversationId");

-- CreateIndex
CREATE INDEX "RequestDealOrder_buyerId_createdAt_idx" ON "RequestDealOrder"("buyerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RequestDealOrder_sellerId_createdAt_idx" ON "RequestDealOrder"("sellerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RequestDealOrder_status_createdAt_idx" ON "RequestDealOrder"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PriceProposal" ADD CONSTRAINT "PriceProposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceProposal" ADD CONSTRAINT "PriceProposal_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDealOrder" ADD CONSTRAINT "RequestDealOrder_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDealOrder" ADD CONSTRAINT "RequestDealOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDealOrder" ADD CONSTRAINT "RequestDealOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDealOrder" ADD CONSTRAINT "RequestDealOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
