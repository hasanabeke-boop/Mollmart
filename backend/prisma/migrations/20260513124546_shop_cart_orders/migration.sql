-- CreateEnum
CREATE TYPE "CatalogOrderStatus" AS ENUM ('processing', 'shipped', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogOrder" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "CatalogOrderStatus" NOT NULL DEFAULT 'processing',
    "currency" VARCHAR(3) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "shippingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "shippingName" TEXT,
    "shippingPhone" TEXT,
    "shippingAddress" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogOrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "CatalogOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItem_buyerId_idx" ON "CartItem"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_buyerId_productId_key" ON "CartItem"("buyerId", "productId");

-- CreateIndex
CREATE INDEX "CatalogOrder_buyerId_createdAt_idx" ON "CatalogOrder"("buyerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CatalogOrder_sellerId_createdAt_idx" ON "CatalogOrder"("sellerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CatalogOrder_status_createdAt_idx" ON "CatalogOrder"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CatalogOrderLine_orderId_idx" ON "CatalogOrderLine"("orderId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOrder" ADD CONSTRAINT "CatalogOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOrder" ADD CONSTRAINT "CatalogOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOrderLine" ADD CONSTRAINT "CatalogOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CatalogOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOrderLine" ADD CONSTRAINT "CatalogOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
