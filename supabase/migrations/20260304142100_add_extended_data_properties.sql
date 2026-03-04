ALTER TABLE "public"."properties" ADD COLUMN IF NOT EXISTS "extended_data" JSONB DEFAULT '{}'::jsonb;
