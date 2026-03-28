CREATE TYPE "OfferStatus" AS ENUM (
  'submitted',
  'updated',
  'withdrawn',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE "OfferStatusHistoryAction" AS ENUM (
  'created',
  'updated',
  'withdrawn',
  'accepted',
  'rejected',
  'expired'
);

CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "message" TEXT NOT NULL,
  "deliveryDays" INTEGER,
  "warrantyInfo" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'submitted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferStatusHistory" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "fromStatus" "OfferStatus",
  "toStatus" "OfferStatus" NOT NULL,
  "action" "OfferStatusHistoryAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Offer_requestId_createdAt_idx" ON "Offer"("requestId", "createdAt" DESC);
CREATE INDEX "Offer_sellerId_createdAt_idx" ON "Offer"("sellerId", "createdAt" DESC);
CREATE INDEX "Offer_requestId_status_idx" ON "Offer"("requestId", "status");
CREATE INDEX "OfferStatusHistory_offerId_createdAt_idx" ON "OfferStatusHistory"("offerId", "createdAt" DESC);

ALTER TABLE "OfferStatusHistory"
  ADD CONSTRAINT "OfferStatusHistory_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "Offer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
