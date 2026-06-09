-- Add seller payout tracking (wallet credited on completed, not on pay)
ALTER TABLE "CatalogOrder" ADD COLUMN "sellerCreditedAt" TIMESTAMP(3);
ALTER TABLE "RequestDealOrder" ADD COLUMN "sellerCreditedAt" TIMESTAMP(3);

-- Legacy request-deal orders already credited seller wallet at payment time
UPDATE "RequestDealOrder" SET "sellerCreditedAt" = "paidAt" WHERE "sellerCreditedAt" IS NULL;

CREATE TYPE "CatalogOrderStatus_new" AS ENUM (
  'paid',
  'in_progress',
  'awaiting_confirmation',
  'completed',
  'cancelled'
);

ALTER TABLE "CatalogOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RequestDealOrder" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "CatalogOrder"
  ALTER COLUMN "status" TYPE "CatalogOrderStatus_new"
  USING (
    CASE "status"::text
      WHEN 'processing' THEN 'paid'
      WHEN 'shipped' THEN 'in_progress'
      WHEN 'delivered' THEN 'awaiting_confirmation'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'paid'
    END
  )::"CatalogOrderStatus_new";

ALTER TABLE "RequestDealOrder"
  ALTER COLUMN "status" TYPE "CatalogOrderStatus_new"
  USING (
    CASE "status"::text
      WHEN 'processing' THEN 'paid'
      WHEN 'shipped' THEN 'in_progress'
      WHEN 'delivered' THEN
        CASE
          WHEN "sellerCreditedAt" IS NOT NULL THEN 'completed'
          ELSE 'awaiting_confirmation'
        END
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'paid'
    END
  )::"CatalogOrderStatus_new";

DROP TYPE "CatalogOrderStatus";
ALTER TYPE "CatalogOrderStatus_new" RENAME TO "CatalogOrderStatus";

ALTER TABLE "CatalogOrder" ALTER COLUMN "status" SET DEFAULT 'paid';
ALTER TABLE "RequestDealOrder" ALTER COLUMN "status" SET DEFAULT 'paid';
