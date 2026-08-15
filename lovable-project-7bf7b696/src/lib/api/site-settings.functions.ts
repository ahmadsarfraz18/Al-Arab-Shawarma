import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Prisma } from "@prisma/client";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";
import { normalizeTheme } from "../theme";
import {
  FALLBACK_OG_IMAGE_URL,
  FALLBACK_SEO,
  type JsonLdObject,
  type PublicSeoSettings,
} from "../seo";
import {
  contactSettingsSchema,
  openingHoursInputSchema,
  paymentSettingsSchema,
  seoSettingsSchema,
  socialLinkIdSchema,
  socialLinkInputSchema,
  socialLinkStatusSchema,
  socialLinkUpdateSchema,
  themeSettingsSchema,
  type ContactSettingsInput,
  type ContentStatus,
  type OpeningHourType,
  type PaymentSettingsInput,
  type SocialPlatform,
} from "../admin/schemas";

export type PublicContactSettings = {
  restaurantName: string;
  tagline: string | null;
  phoneDisplay: string;
  phoneTel: string;
  whatsappNumber: string;
  address: string;
  email: string | null;
  mapsEmbedUrl: string | null;
  mapsDirectionsUrl: string | null;
};

export type PublicPaymentSettings = {
  easypaisaNumber: string;
  easypaisaTitle: string;
  bankName: string;
  bankTitle: string;
  bankIban: string;
  paymentNote: string | null;
};

export type PublicOpeningHour = {
  dayOfWeek: number;
  type: OpeningHourType;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type PublicOpeningHours = {
  restaurant: PublicOpeningHour[];
  delivery: PublicOpeningHour[];
};

export type PublicSocialLink = {
  platform: SocialPlatform;
  url: string;
  iconKey: string;
};

export type PublicThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
};

export type PublicSiteSettings = {
  contact: PublicContactSettings;
  payment: PublicPaymentSettings;
  openingHours: PublicOpeningHours;
  socialLinks: PublicSocialLink[];
  theme: PublicThemeSettings;
};

const CACHE_TTL_MS = 60_000;

let cached: { expiresAt: number; value: PublicSiteSettings } | null = null;

const OPENING_HOUR_DAYS = [0, 1, 2, 3, 4, 5, 6];

function toTimeString(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function toTimeDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

const SOCIAL_LINK_ICON_BY_PLATFORM: Record<SocialPlatform, string> = {
  whatsapp: "message-circle",
  instagram: "instagram",
  facebook: "facebook",
};

const SOCIAL_LINK_PLATFORMS: ReadonlySet<string> = new Set(
  Object.keys(SOCIAL_LINK_ICON_BY_PLATFORM),
);

function isPlaceholderUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed === "" || trimmed === "#";
}

function fallbackOpeningHours(): PublicOpeningHours {
  const make = (type: OpeningHourType, closeTime: string) =>
    OPENING_HOUR_DAYS.map((dayOfWeek) => ({
      dayOfWeek,
      type,
      openTime: "16:00",
      closeTime,
      isClosed: false,
    }));
  return {
    restaurant: make("restaurant", "04:00"),
    delivery: make("delivery", "02:00"),
  };
}

function groupOpeningHours(
  rows: {
    dayOfWeek: number;
    type: string;
    openTime: Date;
    closeTime: Date;
    isClosed: boolean;
  }[],
): PublicOpeningHours {
  const groups: Record<OpeningHourType, PublicOpeningHour[]> = {
    restaurant: [],
    delivery: [],
  };
  for (const row of rows) {
    if (row.type === "restaurant" || row.type === "delivery") {
      groups[row.type].push({
        dayOfWeek: row.dayOfWeek,
        type: row.type,
        openTime: toTimeString(row.openTime),
        closeTime: toTimeString(row.closeTime),
        isClosed: row.isClosed,
      });
    }
  }
  for (const type of ["restaurant", "delivery"] as const) {
    groups[type].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }
  return groups;
}

async function loadThemeSettings(): Promise<PublicThemeSettings> {
  const active =
    (await prisma.themeSettings.findFirst({ where: { isActive: true } })) ??
    (await prisma.themeSettings.findFirst());
  return normalizeTheme(active);
}

async function loadSiteSettings(): Promise<PublicSiteSettings> {
  const [contact, payment, openingHours, socialLinks, theme] = await Promise.all([
    prisma.contactInfo.findFirst(),
    prisma.paymentSettings.findFirst(),
    prisma.openingHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.socialLink.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { platform: "asc" }],
    }),
    loadThemeSettings(),
  ]);

  return {
    contact: {
      restaurantName: contact?.restaurantName ?? "Al-Arab Shawarma",
      tagline: contact?.tagline ?? null,
      phoneDisplay: contact?.phoneDisplay ?? "0333-3686848",
      phoneTel: contact?.phoneTel ?? "+92-333-3686848",
      whatsappNumber: contact?.whatsappNumber ?? "923333686848",
      address: contact?.address ?? "Main Sharfabad Signal, Karachi, Pakistan",
      email: contact?.email ?? null,
      mapsEmbedUrl: contact?.mapsEmbedUrl ?? null,
      mapsDirectionsUrl: contact?.mapsDirectionsUrl ?? null,
    },
    payment: {
      easypaisaNumber: payment?.easypaisaNumber ?? "0333-3686848",
      easypaisaTitle: payment?.easypaisaTitle ?? "Sada Haider Haidri",
      bankName: payment?.bankName ?? "Faysal Bank",
      bankTitle: payment?.bankTitle ?? "SADA HAIDER HADERI",
      bankIban: payment?.bankIban ?? "PK86FAYS3574703000003897",
      paymentNote: payment?.paymentNote ?? null,
    },
    openingHours:
      openingHours.length > 0 ? groupOpeningHours(openingHours) : fallbackOpeningHours(),
    socialLinks: socialLinks
      .filter((l) => SOCIAL_LINK_PLATFORMS.has(l.platform) && !isPlaceholderUrl(l.url))
      .map((l) => ({
        platform: l.platform as SocialPlatform,
        url: l.url,
        iconKey: l.iconKey,
      })),
    theme,
  };
}

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteSettings> => {
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.value;

    const value = await loadSiteSettings();
    cached = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  },
);

// ---------------------------------------------------------------------------
// SEO settings — public getter (60s cache) + admin DTO/getter/updater.
// The SeoSettings row drives every SEO <head> tag on the public homepage.
// ---------------------------------------------------------------------------

let seoCached: { expiresAt: number; value: PublicSeoSettings } | null = null;

type SeoRow = {
  title: string;
  description: string;
  keywords: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  jsonLd: Prisma.JsonValue | null;
  ogImage: { url: string } | null;
};

function toPublicSeo(row: SeoRow): PublicSeoSettings {
  return {
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    robotsIndex: row.robotsIndex,
    robotsFollow: row.robotsFollow,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    twitterCard: row.twitterCard,
    canonicalUrl: row.canonicalUrl,
    jsonLd: (row.jsonLd as unknown as JsonLdObject) ?? null,
    ogImageUrl: row.ogImage?.url ?? FALLBACK_OG_IMAGE_URL,
  };
}

export const getPublicSeoSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSeoSettings> => {
    const now = Date.now();
    if (seoCached && seoCached.expiresAt > now) return seoCached.value;

    const row = await prisma.seoSettings.findFirst({ include: { ogImage: true } });
    const value = row ? toPublicSeo(row) : FALLBACK_SEO;
    seoCached = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  },
);

export type AdminContactSettingsDto = {
  id: number;
  restaurantName: string;
  tagline: string | null;
  phoneDisplay: string;
  phoneTel: string;
  whatsappNumber: string;
  address: string;
  email: string | null;
  mapsEmbedUrl: string | null;
  mapsDirectionsUrl: string | null;
  updatedAt: string;
};

export type AdminPaymentSettingsDto = {
  id: number;
  easypaisaNumber: string;
  easypaisaTitle: string;
  bankName: string;
  bankTitle: string;
  bankIban: string;
  paymentNote: string | null;
  updatedAt: string;
};

export type AdminOpeningHourDto = {
  id: number;
  dayOfWeek: number;
  type: OpeningHourType;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  updatedAt: string;
};

export type AdminOpeningHours = {
  items: AdminOpeningHourDto[];
};

export type AdminSocialLinkDto = {
  id: string;
  platform: SocialPlatform;
  url: string;
  iconKey: string;
  status: ContentStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminThemeSettingsDto = {
  id: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  updatedAt: string;
};

export type AdminSeoSettingsDto = {
  id: number;
  title: string;
  description: string;
  keywords: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  jsonLd: JsonLdObject | null;
  ogImageUrl: string | null;
  updatedAt: string;
};

export type AdminSiteSettings = {
  contact: AdminContactSettingsDto;
  payment: AdminPaymentSettingsDto;
  openingHours: AdminOpeningHours;
  socialLinks: AdminSocialLinkDto[];
  theme: AdminThemeSettingsDto;
  seo: AdminSeoSettingsDto;
};

function toContactDto(contact: {
  id: number;
  restaurantName: string;
  tagline: string | null;
  phoneDisplay: string;
  phoneTel: string;
  whatsappNumber: string;
  address: string;
  email: string | null;
  mapsEmbedUrl: string | null;
  mapsDirectionsUrl: string | null;
  updatedAt: Date;
}): AdminContactSettingsDto {
  return {
    id: contact.id,
    restaurantName: contact.restaurantName,
    tagline: contact.tagline,
    phoneDisplay: contact.phoneDisplay,
    phoneTel: contact.phoneTel,
    whatsappNumber: contact.whatsappNumber,
    address: contact.address,
    email: contact.email,
    mapsEmbedUrl: contact.mapsEmbedUrl,
    mapsDirectionsUrl: contact.mapsDirectionsUrl,
    updatedAt: contact.updatedAt.toISOString(),
  };
}

function toPaymentDto(payment: {
  id: number;
  easypaisaNumber: string;
  easypaisaTitle: string;
  bankName: string;
  bankTitle: string;
  bankIban: string;
  paymentNote: string | null;
  updatedAt: Date;
}): AdminPaymentSettingsDto {
  return {
    id: payment.id,
    easypaisaNumber: payment.easypaisaNumber,
    easypaisaTitle: payment.easypaisaTitle,
    bankName: payment.bankName,
    bankTitle: payment.bankTitle,
    bankIban: payment.bankIban,
    paymentNote: payment.paymentNote,
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function toOpeningHoursDto(row: {
  id: number;
  dayOfWeek: number;
  type: string;
  openTime: Date;
  closeTime: Date;
  isClosed: boolean;
  updatedAt: Date;
}): AdminOpeningHourDto {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    type: row.type === "delivery" ? "delivery" : "restaurant",
    openTime: toTimeString(row.openTime),
    closeTime: toTimeString(row.closeTime),
    isClosed: row.isClosed,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSocialLinkDto(link: {
  id: string;
  platform: string;
  url: string;
  iconKey: string;
  status: ContentStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): AdminSocialLinkDto {
  return {
    id: link.id,
    platform: link.platform as SocialPlatform,
    url: link.url,
    iconKey: link.iconKey,
    status: link.status,
    displayOrder: link.displayOrder,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

function toThemeDto(theme: {
  id: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  updatedAt: Date;
}): AdminThemeSettingsDto {
  return {
    id: theme.id,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    isActive: theme.isActive,
    updatedAt: theme.updatedAt.toISOString(),
  };
}

function toSeoDto(row: SeoRow & { id: number; updatedAt: Date }): AdminSeoSettingsDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    robotsIndex: row.robotsIndex,
    robotsFollow: row.robotsFollow,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    twitterCard: row.twitterCard,
    canonicalUrl: row.canonicalUrl,
    jsonLd: (row.jsonLd as unknown as JsonLdObject) ?? null,
    ogImageUrl: row.ogImage?.url ?? FALLBACK_OG_IMAGE_URL,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requireSession() {
  const headers = await getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Authentication required");
  return session;
}

async function logActivity(
  session: { user: { id: string } },
  action: string,
  entityType: string,
  entityId: string,
  details: Prisma.InputJsonValue,
) {
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

function changedKeys(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
  return Object.keys(next).filter((k) => {
    const a = prev[k];
    const b = next[k];
    if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    return a !== b;
  });
}

export const getAdminSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSiteSettings> => {
    await requireSession();

    const [contact, payment, openingHours, socialLinks, theme, seo] = await Promise.all([
      prisma.contactInfo.findFirst(),
      prisma.paymentSettings.findFirst(),
      prisma.openingHours.findMany({ orderBy: [{ dayOfWeek: "asc" }, { type: "asc" }] }),
      prisma.socialLink.findMany({ orderBy: [{ displayOrder: "asc" }, { platform: "asc" }] }),
      prisma.themeSettings.findFirst(),
      prisma.seoSettings.findFirst({ include: { ogImage: true } }),
    ]);
    if (!contact || !payment) throw new Error("Settings not found");
    if (!theme) throw new Error("Theme settings not found");
    if (!seo) throw new Error("SEO settings not found");

    return {
      contact: toContactDto(contact),
      payment: toPaymentDto(payment),
      openingHours: { items: openingHours.map(toOpeningHoursDto) },
      socialLinks: socialLinks.map(toSocialLinkDto),
      theme: toThemeDto(theme),
      seo: toSeoDto(seo),
    };
  },
);

export const updateThemeSettings = createServerFn({ method: "POST" })
  .validator(themeSettingsSchema)
  .handler(async ({ data }): Promise<AdminThemeSettingsDto> => {
    const session = await requireSession();

    const existing = await prisma.themeSettings.findFirst();
    if (!existing) throw new Error("Theme settings not found");

    const updateData: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
      isActive?: boolean;
    } = {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
    };
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.themeSettings.update({
      where: { id: existing.id },
      data: updateData,
    });

    const changed = changedKeys(
      {
        primaryColor: existing.primaryColor,
        secondaryColor: existing.secondaryColor,
        accentColor: existing.accentColor,
        backgroundColor: existing.backgroundColor,
        textColor: existing.textColor,
      },
      updateData,
    );

    cached = null;
    await logActivity(session, "update", "theme_settings", String(updated.id), {
      changed,
    });

    return toThemeDto(updated);
  });

export const updateContactSettings = createServerFn({ method: "POST" })
  .validator(contactSettingsSchema)
  .handler(async ({ data }): Promise<AdminContactSettingsDto> => {
    const session = await requireSession();

    const existing = await prisma.contactInfo.findFirst();
    if (!existing) throw new Error("Contact settings not found");

    const updated = await prisma.contactInfo.update({
      where: { id: existing.id },
      data,
    });

    const prev: Record<string, unknown> = {
      restaurantName: existing.restaurantName,
      tagline: existing.tagline,
      phoneDisplay: existing.phoneDisplay,
      phoneTel: existing.phoneTel,
      whatsappNumber: existing.whatsappNumber,
      address: existing.address,
      email: existing.email,
      mapsEmbedUrl: existing.mapsEmbedUrl,
      mapsDirectionsUrl: existing.mapsDirectionsUrl,
    };
    const changed = changedKeys(prev, data);

    cached = null;
    await logActivity(session, "update", "contact_settings", String(updated.id), {
      changed,
      restaurantName: updated.restaurantName,
    });

    return toContactDto(updated);
  });

export const updatePaymentSettings = createServerFn({ method: "POST" })
  .validator(paymentSettingsSchema)
  .handler(async ({ data }): Promise<AdminPaymentSettingsDto> => {
    const session = await requireSession();

    const existing = await prisma.paymentSettings.findFirst();
    if (!existing) throw new Error("Payment settings not found");

    const updated = await prisma.paymentSettings.update({
      where: { id: existing.id },
      data,
    });

    const prev: Record<string, unknown> = {
      easypaisaNumber: existing.easypaisaNumber,
      easypaisaTitle: existing.easypaisaTitle,
      bankName: existing.bankName,
      bankTitle: existing.bankTitle,
      bankIban: existing.bankIban,
      paymentNote: existing.paymentNote,
    };
    const changed = changedKeys(prev, data);

    cached = null;
    await logActivity(session, "update", "payment_settings", String(updated.id), {
      changed,
      bankName: updated.bankName,
    });

    return toPaymentDto(updated);
  });

export const updateOpeningHours = createServerFn({ method: "POST" })
  .validator(openingHoursInputSchema)
  .handler(async ({ data }): Promise<AdminOpeningHours> => {
    const session = await requireSession();

    const existing = await prisma.openingHours.findMany();

    const changed: string[] = [];
    for (const item of data.items) {
      const row = existing.find((r) => r.dayOfWeek === item.dayOfWeek && r.type === item.type);

      if (row) {
        const prevTime = `${toTimeString(row.openTime)}-${toTimeString(row.closeTime)}`;
        const nextTime = `${item.openTime}-${item.closeTime}`;
        if (row.isClosed !== item.isClosed || prevTime !== nextTime) {
          changed.push(`${item.type}:${item.dayOfWeek}`);
        }
        await prisma.openingHours.update({
          where: { id: row.id },
          data: {
            openTime: toTimeDate(item.openTime),
            closeTime: toTimeDate(item.closeTime),
            isClosed: item.isClosed,
          },
        });
      } else {
        // The table uses @@unique([dayOfWeek, type]); upsert keeps a missing
        // row (e.g. a new type/day added later) in sync without schema changes.
        await prisma.openingHours.upsert({
          where: { dayOfWeek_type: { dayOfWeek: item.dayOfWeek, type: item.type } },
          update: {
            openTime: toTimeDate(item.openTime),
            closeTime: toTimeDate(item.closeTime),
            isClosed: item.isClosed,
          },
          create: {
            dayOfWeek: item.dayOfWeek,
            type: item.type,
            openTime: toTimeDate(item.openTime),
            closeTime: toTimeDate(item.closeTime),
            isClosed: item.isClosed,
          },
        });
        changed.push(`${item.type}:${item.dayOfWeek}`);
      }
    }

    cached = null;
    await logActivity(session, "update", "opening_hours", "restaurant-delivery", {
      changed: changed.length > 0 ? changed : ["no changes"],
    });

    const updated = await prisma.openingHours.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { type: "asc" }],
    });
    return { items: updated.map(toOpeningHoursDto) };
  });

export const createSocialLink = createServerFn({ method: "POST" })
  .validator(socialLinkInputSchema)
  .handler(async ({ data }): Promise<AdminSocialLinkDto> => {
    const session = await requireSession();

    const existing = await prisma.socialLink.findUnique({
      where: { platform: data.platform },
    });
    if (existing) throw new Error("A link for this platform already exists");

    const created = await prisma.socialLink.create({
      data: {
        platform: data.platform,
        url: data.url,
        iconKey: SOCIAL_LINK_ICON_BY_PLATFORM[data.platform],
        status: data.status,
        displayOrder: data.displayOrder,
      },
    });

    cached = null;
    await logActivity(session, "create", "social_link", created.id, {
      platform: created.platform,
      url: created.url,
    });

    return toSocialLinkDto(created);
  });

export const updateSocialLink = createServerFn({ method: "POST" })
  .validator(socialLinkUpdateSchema)
  .handler(async ({ data }): Promise<AdminSocialLinkDto> => {
    const session = await requireSession();

    const existing = await prisma.socialLink.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Social link not found");

    const duplicate = await prisma.socialLink.findUnique({
      where: { platform: data.platform },
    });
    if (duplicate && duplicate.id !== data.id) {
      throw new Error("A link for this platform already exists");
    }

    const updated = await prisma.socialLink.update({
      where: { id: data.id },
      data: {
        platform: data.platform,
        url: data.url,
        iconKey: SOCIAL_LINK_ICON_BY_PLATFORM[data.platform],
        status: data.status,
        displayOrder: data.displayOrder,
      },
    });

    const changed = changedKeys(
      {
        platform: existing.platform,
        url: existing.url,
        status: existing.status,
        displayOrder: existing.displayOrder,
      },
      {
        platform: data.platform,
        url: data.url,
        status: data.status,
        displayOrder: data.displayOrder,
      },
    );

    cached = null;
    await logActivity(session, "update", "social_link", updated.id, {
      changed,
      platform: updated.platform,
    });

    return toSocialLinkDto(updated);
  });

export const setSocialLinkStatus = createServerFn({ method: "POST" })
  .validator(socialLinkStatusSchema)
  .handler(async ({ data }): Promise<AdminSocialLinkDto> => {
    const session = await requireSession();

    const existing = await prisma.socialLink.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Social link not found");

    const updated = await prisma.socialLink.update({
      where: { id: data.id },
      data: { status: data.status },
    });

    cached = null;
    await logActivity(session, "status_update", "social_link", updated.id, {
      status: updated.status,
      platform: updated.platform,
    });

    return toSocialLinkDto(updated);
  });

export const deleteSocialLink = createServerFn({ method: "POST" })
  .validator(socialLinkIdSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const session = await requireSession();

    const existing = await prisma.socialLink.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Social link not found");

    await prisma.socialLink.delete({ where: { id: data.id } });

    cached = null;
    await logActivity(session, "delete", "social_link", data.id, {
      platform: existing.platform,
    });

    return { ok: true };
  });

export const updateSeoSettings = createServerFn({ method: "POST" })
  .validator(seoSettingsSchema)
  .handler(async ({ data }): Promise<AdminSeoSettingsDto> => {
    const session = await requireSession();

    const existing = await prisma.seoSettings.findFirst();
    if (!existing) throw new Error("SEO settings not found");

    const updated = await prisma.seoSettings.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        description: data.description,
        keywords: data.keywords,
        robotsIndex: data.robotsIndex,
        robotsFollow: data.robotsFollow,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        twitterCard: data.twitterCard,
        canonicalUrl: data.canonicalUrl,
        jsonLd: data.jsonLd === null ? Prisma.DbNull : (data.jsonLd as Prisma.InputJsonValue),
      },
      include: { ogImage: true },
    });

    const changed = changedKeys(
      {
        title: existing.title,
        description: existing.description,
        keywords: existing.keywords,
        robotsIndex: existing.robotsIndex,
        robotsFollow: existing.robotsFollow,
        ogTitle: existing.ogTitle,
        ogDescription: existing.ogDescription,
        twitterCard: existing.twitterCard,
        canonicalUrl: existing.canonicalUrl,
        jsonLd: (existing.jsonLd as unknown as JsonLdObject) ?? null,
      },
      data,
    );

    seoCached = null;
    await logActivity(session, "update", "seo_settings", String(updated.id), { changed });

    return toSeoDto(updated);
  });
