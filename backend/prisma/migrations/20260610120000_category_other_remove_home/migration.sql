-- Add "Other" category and retire redundant "Home" (confused with breadcrumb "Home").
INSERT INTO "Category" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES ('cm_seed_cat_other0001', 'Other', 'other', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "CatalogProduct"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'other' LIMIT 1)
WHERE "categoryId" IN (SELECT "id" FROM "Category" WHERE "slug" = 'home')
   OR "categoryId" = 'home';

UPDATE "Request"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'other' LIMIT 1)
WHERE "categoryId" IN (SELECT "id" FROM "Category" WHERE "slug" = 'home')
   OR "categoryId" = 'home';

DELETE FROM "Category" WHERE "slug" = 'home';
