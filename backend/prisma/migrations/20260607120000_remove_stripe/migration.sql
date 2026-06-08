-- Drop Stripe-only payment session tracking and order Stripe columns.
DROP TABLE IF EXISTS "PaymentSession";

DROP INDEX IF EXISTS "CatalogOrder_stripeSessionId_key";
DROP INDEX IF EXISTS "CatalogOrder_stripePaymentIntentId_key";
DROP INDEX IF EXISTS "RequestDealOrder_stripeSessionId_key";
DROP INDEX IF EXISTS "RequestDealOrder_stripePaymentIntentId_key";

ALTER TABLE "CatalogOrder" DROP COLUMN IF EXISTS "stripeSessionId";
ALTER TABLE "CatalogOrder" DROP COLUMN IF EXISTS "stripePaymentIntentId";
ALTER TABLE "RequestDealOrder" DROP COLUMN IF EXISTS "stripeSessionId";
ALTER TABLE "RequestDealOrder" DROP COLUMN IF EXISTS "stripePaymentIntentId";
