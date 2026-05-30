-- Add Stripe/payment bookkeeping while keeping demo payments as the default path.
ALTER TABLE "CatalogOrder"
ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'demo',
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT;

ALTER TABLE "RequestDealOrder"
ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'demo',
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT;

CREATE TABLE "PaymentSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "stripeSessionId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT,
  "conversationId" TEXT,
  "checkoutCurrency" VARCHAR(3),
  "shippingName" TEXT,
  "shippingPhone" TEXT,
  "shippingAddress" TEXT,
  "cartSnapshot" JSONB,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogOrder_stripeSessionId_key" ON "CatalogOrder"("stripeSessionId");
CREATE UNIQUE INDEX "CatalogOrder_stripePaymentIntentId_key" ON "CatalogOrder"("stripePaymentIntentId");
CREATE UNIQUE INDEX "RequestDealOrder_stripeSessionId_key" ON "RequestDealOrder"("stripeSessionId");
CREATE UNIQUE INDEX "RequestDealOrder_stripePaymentIntentId_key" ON "RequestDealOrder"("stripePaymentIntentId");
CREATE UNIQUE INDEX "PaymentSession_stripeSessionId_key" ON "PaymentSession"("stripeSessionId");
CREATE INDEX "PaymentSession_userId_createdAt_idx" ON "PaymentSession"("userId", "createdAt" DESC);
CREATE INDEX "PaymentSession_kind_status_idx" ON "PaymentSession"("kind", "status");
CREATE INDEX "PaymentSession_conversationId_idx" ON "PaymentSession"("conversationId");
