-- Delivery contact captured at request-deal demo checkout (same shape as catalog orders).
ALTER TABLE "RequestDealOrder" ADD COLUMN "shippingName" TEXT;
ALTER TABLE "RequestDealOrder" ADD COLUMN "shippingPhone" TEXT;
ALTER TABLE "RequestDealOrder" ADD COLUMN "shippingAddress" TEXT;
