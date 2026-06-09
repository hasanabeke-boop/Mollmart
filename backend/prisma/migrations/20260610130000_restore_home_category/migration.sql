-- Restore "Home" category for home goods (keeps "Other" from prior migration).
INSERT INTO "Category" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES ('cm_seed_cat_home00001', 'Home', 'home', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
