-- Add slug column (nullable first to handle existing rows)
ALTER TABLE "users" ADD COLUMN "slug" VARCHAR(100);

-- Generate slugs for existing users
UPDATE "users" SET "slug" = LOWER(REGEXP_REPLACE(TRIM("nome"), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);

-- Make slug required and unique
ALTER TABLE "users" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_slug_key" UNIQUE ("slug");
