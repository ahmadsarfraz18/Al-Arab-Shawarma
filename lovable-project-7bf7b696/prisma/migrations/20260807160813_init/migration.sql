-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "image_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_variants" (
    "id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_section" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "badge_text" TEXT,
    "headline" TEXT NOT NULL,
    "headline_highlight" TEXT,
    "subheadline" TEXT,
    "arabic_tagline" TEXT,
    "badge_title" TEXT,
    "badge_subtitle" TEXT,
    "cta_primary_text" TEXT,
    "cta_primary_href" TEXT,
    "cta_secondary_text" TEXT,
    "cta_secondary_href" TEXT,
    "background_image_id" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hero_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_features" (
    "id" UUID NOT NULL,
    "hero_id" INTEGER NOT NULL,
    "icon_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hero_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_section" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "badge_label" TEXT,
    "heading" TEXT NOT NULL,
    "heading_highlight" TEXT,
    "body" TEXT NOT NULL,
    "image_id" UUID,
    "image_overlay_title" TEXT,
    "image_overlay_text" TEXT,
    "why_us_heading" TEXT,
    "why_us_heading_highlight" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "about_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_features" (
    "id" UUID NOT NULL,
    "about_id" INTEGER NOT NULL,
    "icon_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "about_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "why_us_features" (
    "id" UUID NOT NULL,
    "about_id" INTEGER NOT NULL,
    "icon_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "why_us_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_info" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "restaurant_name" TEXT NOT NULL,
    "tagline" TEXT,
    "phone_display" TEXT NOT NULL,
    "phone_tel" TEXT NOT NULL,
    "whatsapp_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "maps_embed_url" TEXT,
    "maps_directions_url" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" SERIAL NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "open_time" TIME(0) NOT NULL,
    "close_time" TIME(0) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "og_title" TEXT,
    "og_description" TEXT,
    "twitter_card" TEXT,
    "og_image_id" UUID,
    "canonical_url" TEXT,
    "json_ld" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "accent_color" TEXT NOT NULL,
    "background_color" TEXT NOT NULL,
    "text_color" TEXT NOT NULL,
    "logo_id" UUID,
    "favicon_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "original_filename" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "content_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "delivery_charge" DECIMAL(10,2) NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_areas" (
    "id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "easypaisa_number" TEXT NOT NULL,
    "easypaisa_title" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_title" TEXT NOT NULL,
    "bank_iban" TEXT NOT NULL,
    "bank_qr_image_id" UUID,
    "payment_note" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_status_display_order_idx" ON "categories"("status", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_slug_key" ON "menu_items"("slug");

-- CreateIndex
CREATE INDEX "menu_items_category_id_status_display_order_idx" ON "menu_items"("category_id", "status", "display_order");

-- CreateIndex
CREATE INDEX "menu_items_status_idx" ON "menu_items"("status");

-- CreateIndex
CREATE INDEX "menu_items_featured_idx" ON "menu_items"("featured");

-- CreateIndex
CREATE INDEX "menu_item_variants_menu_item_id_display_order_idx" ON "menu_item_variants"("menu_item_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_variants_menu_item_id_label_key" ON "menu_item_variants"("menu_item_id", "label");

-- CreateIndex
CREATE INDEX "hero_features_hero_id_display_order_idx" ON "hero_features"("hero_id", "display_order");

-- CreateIndex
CREATE INDEX "about_features_about_id_display_order_idx" ON "about_features"("about_id", "display_order");

-- CreateIndex
CREATE INDEX "why_us_features_about_id_display_order_idx" ON "why_us_features"("about_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "opening_hours_day_of_week_type_key" ON "opening_hours"("day_of_week", "type");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");

-- CreateIndex
CREATE INDEX "social_links_status_display_order_idx" ON "social_links"("status", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "media_storage_path_key" ON "media"("storage_path");

-- CreateIndex
CREATE INDEX "media_content_type_idx" ON "media"("content_type");

-- CreateIndex
CREATE INDEX "media_status_display_order_idx" ON "media"("status", "display_order");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_user_id_created_at_idx" ON "activity_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_created_at_idx" ON "activity_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_name_key" ON "delivery_zones"("name");

-- CreateIndex
CREATE INDEX "delivery_zones_status_display_order_idx" ON "delivery_zones"("status", "display_order");

-- CreateIndex
CREATE INDEX "delivery_areas_zone_id_status_name_idx" ON "delivery_areas"("zone_id", "status", "name");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_areas_zone_id_name_key" ON "delivery_areas"("zone_id", "name");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_section" ADD CONSTRAINT "hero_section_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_features" ADD CONSTRAINT "hero_features_hero_id_fkey" FOREIGN KEY ("hero_id") REFERENCES "hero_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_section" ADD CONSTRAINT "about_section_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_features" ADD CONSTRAINT "about_features_about_id_fkey" FOREIGN KEY ("about_id") REFERENCES "about_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "why_us_features" ADD CONSTRAINT "why_us_features_about_id_fkey" FOREIGN KEY ("about_id") REFERENCES "about_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_og_image_id_fkey" FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_favicon_id_fkey" FOREIGN KEY ("favicon_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_areas" ADD CONSTRAINT "delivery_areas_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "delivery_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_bank_qr_image_id_fkey" FOREIGN KEY ("bank_qr_image_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Manual constraints (not expressible in Prisma schema)
-- ---------------------------------------------------------------------------

-- Singleton tables: enforce a single row (id = 1).
ALTER TABLE "hero_section" ADD CONSTRAINT "hero_section_singleton_check" CHECK ("id" = 1);
ALTER TABLE "about_section" ADD CONSTRAINT "about_section_singleton_check" CHECK ("id" = 1);
ALTER TABLE "contact_info" ADD CONSTRAINT "contact_info_singleton_check" CHECK ("id" = 1);
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_singleton_check" CHECK ("id" = 1);
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_singleton_check" CHECK ("id" = 1);
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_singleton_check" CHECK ("id" = 1);

-- Money must never be negative.
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_base_price_non_negative_check" CHECK ("base_price" >= 0);
ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_price_non_negative_check" CHECK ("price" >= 0);
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_delivery_charge_non_negative_check" CHECK ("delivery_charge" >= 0);

-- opening_hours.day_of_week: 0 (Sunday) .. 6 (Saturday).
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_day_of_week_range_check" CHECK ("day_of_week" BETWEEN 0 AND 6);

-- ---------------------------------------------------------------------------
-- Read-only dashboard stats view (not modelled in Prisma)
-- ---------------------------------------------------------------------------
CREATE VIEW "admin_dashboard_stats" AS
SELECT
  (SELECT COUNT(*) FROM "categories")::int                       AS total_categories,
  (SELECT COUNT(*) FROM "categories" WHERE "status" = 'ACTIVE')::int AS active_categories,
  (SELECT COUNT(*) FROM "menu_items")::int                       AS total_menu_items,
  (SELECT COUNT(*) FROM "menu_items" WHERE "status" = 'ACTIVE')::int AS active_menu_items,
  (SELECT COUNT(*) FROM "menu_items" WHERE "featured")::int      AS featured_menu_items,
  (SELECT COUNT(*) FROM "menu_item_variants")::int               AS total_variants,
  (SELECT COUNT(*) FROM "media")::int                            AS total_media,
  (SELECT COUNT(*) FROM "media" WHERE "status" = 'ACTIVE')::int  AS active_media,
  (SELECT COUNT(*) FROM "delivery_zones")::int                   AS total_delivery_zones,
  (SELECT COUNT(*) FROM "delivery_areas")::int                   AS total_delivery_areas,
  (SELECT COUNT(*) FROM "social_links" WHERE "status" = 'ACTIVE')::int AS active_social_links,
  (SELECT COUNT(*) FROM "users")::int                            AS total_users,
  (SELECT COUNT(*) FROM "activity_logs")::int                    AS total_activity_logs;


