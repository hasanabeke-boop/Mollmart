-- CreateEnum
CREATE TYPE "OrderCancellationKind" AS ENUM ('catalog', 'request_deal');

-- CreateEnum
CREATE TYPE "OrderCancellationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "OrderCancellationRequest" (
    "id" TEXT NOT NULL,
    "orderKind" "OrderCancellationKind" NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "OrderCancellationStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderCancellationRequest_status_createdAt_idx" ON "OrderCancellationRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OrderCancellationRequest_orderKind_orderId_idx" ON "OrderCancellationRequest"("orderKind", "orderId");

-- CreateIndex
CREATE INDEX "OrderCancellationRequest_requestedById_createdAt_idx" ON "OrderCancellationRequest"("requestedById", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "OrderCancellationRequest" ADD CONSTRAINT "OrderCancellationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCancellationRequest" ADD CONSTRAINT "OrderCancellationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
