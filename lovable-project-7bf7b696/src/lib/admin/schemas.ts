import { z } from "zod";

import { FEATURE_ICON_KEYS } from "../feature-icons";
import type { JsonLdObject } from "../seo";

export const CONTENT_STATUSES = ["ACTIVE", "HIDDEN", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const statusSchema = z.enum(CONTENT_STATUSES);

export const iconKeySchema = z.enum(FEATURE_ICON_KEYS, { message: "Pick a valid icon" });

const priceSchema = z
  .number({ message: "Price must be a number" })
  .finite()
  .min(0, "Price must be 0 or more")
  .max(100000, "Price is too large");

export const menuItemVariantSchema = z.object({
  label: z.string().trim().min(1, "Variant label is required").max(40),
  price: priceSchema,
});

export const menuItemInputSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .nullable(),
  basePrice: priceSchema,
  status: statusSchema,
  featured: z.boolean(),
  displayOrder: z.number().int().min(-10000).max(10000),
  variants: z.array(menuItemVariantSchema).max(12, "Too many variants"),
});

export const menuItemUpdateSchema = menuItemInputSchema.extend({
  id: z.string().min(1, "Item id is required"),
});

export const menuItemStatusSchema = z.object({
  id: z.string().min(1, "Item id is required"),
  status: statusSchema,
});

export const menuItemIdSchema = z.object({
  id: z.string().min(1, "Item id is required"),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name must be 60 characters or fewer"),
  status: statusSchema,
  displayOrder: z.number().int().min(-10000).max(10000),
});

// ---------------------------------------------------------------------------
// Delivery zones & areas
// ---------------------------------------------------------------------------

const deliveryChargeSchema = priceSchema;

export const deliveryZoneInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Zone name is required")
    .max(60, "Zone name must be 60 characters or fewer"),
  deliveryCharge: deliveryChargeSchema,
  status: statusSchema,
  displayOrder: z.number().int().min(-10000).max(10000),
});

export const deliveryZoneUpdateSchema = deliveryZoneInputSchema.extend({
  id: z.string().min(1, "Zone id is required"),
});

export const deliveryZoneIdSchema = z.object({
  id: z.string().min(1, "Zone id is required"),
});

export const deliveryZoneStatusSchema = z.object({
  id: z.string().min(1, "Zone id is required"),
  status: statusSchema,
});

export const deliveryAreaInputSchema = z.object({
  zoneId: z.string().min(1, "Zone is required"),
  name: z
    .string()
    .trim()
    .min(1, "Area name is required")
    .max(120, "Area name must be 120 characters or fewer"),
  status: statusSchema,
});

export const deliveryAreaUpdateSchema = z.object({
  id: z.string().min(1, "Area id is required"),
  zoneId: z.string().min(1, "Zone is required"),
  name: z
    .string()
    .trim()
    .min(1, "Area name is required")
    .max(120, "Area name must be 120 characters or fewer"),
  status: statusSchema,
});

export const deliveryAreaIdSchema = z.object({
  id: z.string().min(1, "Area id is required"),
});

export const deliveryAreaStatusSchema = z.object({
  id: z.string().min(1, "Area id is required"),
  status: statusSchema,
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneInputSchema>;
export type DeliveryAreaInput = z.infer<typeof deliveryAreaInputSchema>;

export const categoryUpdateSchema = categoryInputSchema.extend({
  id: z.string().min(1, "Category id is required"),
});

export const categoryIdSchema = z.object({
  id: z.string().min(1, "Category id is required"),
});

export const menuFiltersSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  categoryId: z.string().optional().default("all"),
  status: z
    .union([statusSchema, z.literal("all")])
    .optional()
    .default("all"),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;

const nullableText = (max: number, message: string) =>
  z.string().trim().max(max, message).nullable();

const nullableEmail = z
  .string()
  .trim()
  .max(120, "Email must be 120 characters or fewer")
  .email("Enter a valid email address")
  .nullable();

const nullableUrl = z
  .string()
  .trim()
  .max(500, "URL must be 500 characters or fewer")
  .url("Enter a valid URL, e.g. https://example.com")
  .nullable();

export const contactSettingsSchema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(1, "Restaurant name is required")
    .max(80, "Restaurant name must be 80 characters or fewer"),
  tagline: nullableText(120, "Tagline must be 120 characters or fewer"),
  phoneDisplay: z
    .string()
    .trim()
    .min(1, "Display phone is required")
    .max(30, "Phone must be 30 characters or fewer"),
  phoneTel: z
    .string()
    .trim()
    .min(1, "Phone (tel) is required")
    .max(30, "Phone must be 30 characters or fewer"),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .max(30, "WhatsApp number must be 30 characters or fewer")
    .regex(/^\d+$/, "Use digits only, with country code (e.g. 923333686848)"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or fewer"),
  email: nullableEmail,
  mapsEmbedUrl: nullableUrl,
  mapsDirectionsUrl: nullableUrl,
});

export const paymentSettingsSchema = z.object({
  easypaisaNumber: z
    .string()
    .trim()
    .min(1, "Easypaisa number is required")
    .max(30, "Easypaisa number must be 30 characters or fewer"),
  easypaisaTitle: z
    .string()
    .trim()
    .min(1, "Easypaisa account title is required")
    .max(80, "Account title must be 80 characters or fewer"),
  bankName: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(80, "Bank name must be 80 characters or fewer"),
  bankTitle: z
    .string()
    .trim()
    .min(1, "Bank account title is required")
    .max(80, "Account title must be 80 characters or fewer"),
  bankIban: z
    .string()
    .trim()
    .min(1, "IBAN is required")
    .max(40, "IBAN must be 40 characters or fewer")
    .regex(/^[A-Za-z0-9]+$/, "IBAN must contain only letters and numbers"),
  paymentNote: nullableText(500, "Payment note must be 500 characters or fewer"),
});

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a valid hex color like #39ff14");

export const themeSettingsSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  isActive: z.boolean().optional(),
});

export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;

export const OPENING_HOUR_TYPES = ["restaurant", "delivery"] as const;
export type OpeningHourType = (typeof OPENING_HOUR_TYPES)[number];

export const OPENING_HOUR_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const time24Schema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM, e.g. 16:00");

export const openingHourInputSchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0, "Day must be between 0 and 6")
    .max(6, "Day must be between 0 and 6"),
  type: z.enum(OPENING_HOUR_TYPES, { message: "Unknown opening-hours type" }),
  openTime: time24Schema,
  closeTime: time24Schema,
  isClosed: z.boolean(),
});

export const openingHoursInputSchema = z.object({
  items: z
    .array(openingHourInputSchema)
    .min(1, "At least one opening-hours row is required")
    .max(14, "Too many opening-hours rows"),
});

export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;
export type OpeningHourInput = z.infer<typeof openingHourInputSchema>;
export type OpeningHoursInput = z.infer<typeof openingHoursInputSchema>;

// ---------------------------------------------------------------------------
// Homepage content (Hero + About + Why Us)
// ---------------------------------------------------------------------------

export const heroFeatureInputSchema = z.object({
  iconKey: iconKeySchema,
  label: z
    .string()
    .trim()
    .min(1, "Feature label is required")
    .max(80, "Feature label must be 80 characters or fewer"),
});

export const whyUsFeatureInputSchema = heroFeatureInputSchema.extend({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or fewer"),
});

export const heroSectionInputSchema = z.object({
  badgeText: nullableText(80, "Badge text must be 80 characters or fewer"),
  headline: z
    .string()
    .trim()
    .min(1, "Headline is required")
    .max(60, "Headline must be 60 characters or fewer"),
  headlineHighlight: nullableText(60, "Highlight must be 60 characters or fewer"),
  subheadline: nullableText(200, "Subheadline must be 200 characters or fewer"),
  arabicTagline: nullableText(80, "Arabic tagline must be 80 characters or fewer"),
  badgeTitle: nullableText(60, "Badge title must be 60 characters or fewer"),
  badgeSubtitle: nullableText(120, "Badge subtitle must be 120 characters or fewer"),
  ctaPrimaryText: nullableText(40, "CTA text must be 40 characters or fewer"),
  ctaPrimaryHref: nullableText(200, "CTA link must be 200 characters or fewer"),
  ctaSecondaryText: nullableText(40, "CTA text must be 40 characters or fewer"),
  ctaSecondaryHref: nullableText(200, "CTA link must be 200 characters or fewer"),
  features: z.array(heroFeatureInputSchema).max(8, "Too many features"),
});

export const aboutSectionInputSchema = z.object({
  badgeLabel: nullableText(60, "Badge label must be 60 characters or fewer"),
  heading: z
    .string()
    .trim()
    .min(1, "Heading is required")
    .max(80, "Heading must be 80 characters or fewer"),
  headingHighlight: nullableText(60, "Highlight must be 60 characters or fewer"),
  body: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(1200, "Content must be 1200 characters or fewer"),
  imageOverlayTitle: nullableText(60, "Overlay title must be 60 characters or fewer"),
  imageOverlayText: nullableText(200, "Overlay text must be 200 characters or fewer"),
  whyUsHeading: nullableText(60, "Why-us heading must be 60 characters or fewer"),
  whyUsHeadingHighlight: nullableText(60, "Why-us highlight must be 60 characters or fewer"),
  features: z.array(heroFeatureInputSchema).max(8, "Too many features"),
  whyUsFeatures: z.array(whyUsFeatureInputSchema).max(12, "Too many why-us features"),
});

export type HeroSectionInput = z.infer<typeof heroSectionInputSchema>;
export type AboutSectionInput = z.infer<typeof aboutSectionInputSchema>;

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const SOCIAL_PLATFORMS = ["whatsapp", "instagram", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialLinkInputSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS, { message: "Pick a valid platform" }),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(500, "URL must be 500 characters or fewer")
    .url("Enter a valid URL, e.g. https://www.facebook.com/yourpage"),
  status: statusSchema,
  displayOrder: z.number().int().min(-10000).max(10000),
});

export const socialLinkUpdateSchema = socialLinkInputSchema.extend({
  id: z.string().min(1, "Link id is required"),
});

export const socialLinkStatusSchema = z.object({
  id: z.string().min(1, "Link id is required"),
  status: statusSchema,
});

export const socialLinkIdSchema = z.object({
  id: z.string().min(1, "Link id is required"),
});

export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;

// ---------------------------------------------------------------------------
// SEO settings
// ---------------------------------------------------------------------------

export const TWITTER_CARD_TYPES = ["summary", "summary_large_image"] as const;
export type TwitterCardType = (typeof TWITTER_CARD_TYPES)[number];

export const seoSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(70, "Keep the title under 70 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(160, "Keep the description under 160 characters"),
  keywords: z.string().trim().max(400, "Keywords must be 400 characters or fewer").nullable(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  ogTitle: z.string().trim().max(70, "Keep the OG title under 70 characters").nullable(),
  ogDescription: z
    .string()
    .trim()
    .max(160, "Keep the OG description under 160 characters")
    .nullable(),
  twitterCard: z.enum(TWITTER_CARD_TYPES, { message: "Pick a valid card type" }).nullable(),
  canonicalUrl: z
    .string()
    .trim()
    .max(500, "Canonical URL must be 500 characters or fewer")
    .nullable(),
  jsonLd: z.custom<JsonLdObject>().nullable(),
});

export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;
