-- CreateEnum
CREATE TYPE "CatalogProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "compareAtPrice" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "galleryUrls" JSONB,
    "status" "CatalogProductStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogProduct_slug_key" ON "CatalogProduct"("slug");

CREATE INDEX "CatalogProduct_sellerId_status_idx" ON "CatalogProduct"("sellerId", "status");

CREATE INDEX "CatalogProduct_status_createdAt_idx" ON "CatalogProduct"("status", "createdAt" DESC);

CREATE INDEX "CatalogProduct_categoryId_status_idx" ON "CatalogProduct"("categoryId", "status");

ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
