import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Prisma } from "@prisma/client";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";
import {
  aboutSectionInputSchema,
  heroSectionInputSchema,
  type ContentStatus,
} from "../admin/schemas";

// ---------------------------------------------------------------------------
// Public homepage content (Hero + About + Why Us)
// ---------------------------------------------------------------------------

export type PublicFeature = {
  iconKey: string;
  label: string;
};

export type PublicWhyUsFeature = {
  iconKey: string;
  label: string;
  description: string;
};

export type PublicHeroContent = {
  badgeText: string | null;
  headline: string;
  headlineHighlight: string | null;
  subheadline: string | null;
  arabicTagline: string | null;
  badgeTitle: string | null;
  badgeSubtitle: string | null;
  ctaPrimaryText: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryHref: string | null;
  features: PublicFeature[];
};

export type PublicAboutContent = {
  badgeLabel: string | null;
  heading: string;
  headingHighlight: string | null;
  body: string;
  imageOverlayTitle: string | null;
  imageOverlayText: string | null;
  whyUsHeading: string | null;
  whyUsHeadingHighlight: string | null;
  features: PublicFeature[];
  whyUsFeatures: PublicWhyUsFeature[];
};

export type PublicSiteContent = {
  hero: PublicHeroContent | null;
  about: PublicAboutContent | null;
};

const CACHE_TTL_MS = 60_000;

let cached: { expiresAt: number; value: PublicSiteContent } | null = null;

function toPublicHero(hero: {
  badgeText: string | null;
  headline: string;
  headlineHighlight: string | null;
  subheadline: string | null;
  arabicTagline: string | null;
  badgeTitle: string | null;
  badgeSubtitle: string | null;
  ctaPrimaryText: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryHref: string | null;
  features: { iconKey: string; label: string }[];
}): PublicHeroContent {
  return {
    badgeText: hero.badgeText,
    headline: hero.headline,
    headlineHighlight: hero.headlineHighlight,
    subheadline: hero.subheadline,
    arabicTagline: hero.arabicTagline,
    badgeTitle: hero.badgeTitle,
    badgeSubtitle: hero.badgeSubtitle,
    ctaPrimaryText: hero.ctaPrimaryText,
    ctaPrimaryHref: hero.ctaPrimaryHref,
    ctaSecondaryText: hero.ctaSecondaryText,
    ctaSecondaryHref: hero.ctaSecondaryHref,
    features: hero.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
  };
}

function toPublicAbout(about: {
  badgeLabel: string | null;
  heading: string;
  headingHighlight: string | null;
  body: string;
  imageOverlayTitle: string | null;
  imageOverlayText: string | null;
  whyUsHeading: string | null;
  whyUsHeadingHighlight: string | null;
  features: { iconKey: string; label: string }[];
  whyUsFeatures: { iconKey: string; label: string; description: string }[];
}): PublicAboutContent {
  return {
    badgeLabel: about.badgeLabel,
    heading: about.heading,
    headingHighlight: about.headingHighlight,
    body: about.body,
    imageOverlayTitle: about.imageOverlayTitle,
    imageOverlayText: about.imageOverlayText,
    whyUsHeading: about.whyUsHeading,
    whyUsHeadingHighlight: about.whyUsHeadingHighlight,
    features: about.features.map((f) => ({ iconKey: f.iconKey, label: f.label })),
    whyUsFeatures: about.whyUsFeatures.map((f) => ({
      iconKey: f.iconKey,
      label: f.label,
      description: f.description,
    })),
  };
}

async function loadSiteContent(): Promise<PublicSiteContent> {
  const [hero, about] = await Promise.all([
    prisma.heroSection.findFirst({
      include: {
        features: {
          where: { status: "ACTIVE" },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.aboutSection.findFirst({
      include: {
        features: {
          where: { status: "ACTIVE" },
          orderBy: { displayOrder: "asc" },
        },
        whyUsFeatures: {
          where: { status: "ACTIVE" },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
  ]);

  return {
    hero: hero ? toPublicHero(hero) : null,
    about: about ? toPublicAbout(about) : null,
  };
}

export const getPublicSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteContent> => {
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.value;

    const value = await loadSiteContent();
    cached = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  },
);

// ---------------------------------------------------------------------------
// Admin — Hero + About DTOs, getters and updaters
// ---------------------------------------------------------------------------

export type AdminHeroFeatureDto = {
  id: string;
  iconKey: string;
  label: string;
  status: ContentStatus;
  displayOrder: number;
};

export type AdminHeroSectionDto = {
  id: number;
  badgeText: string | null;
  headline: string;
  headlineHighlight: string | null;
  subheadline: string | null;
  arabicTagline: string | null;
  badgeTitle: string | null;
  badgeSubtitle: string | null;
  ctaPrimaryText: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryHref: string | null;
  features: AdminHeroFeatureDto[];
  updatedAt: string;
};

export type AdminAboutFeatureDto = AdminHeroFeatureDto;

export type AdminWhyUsFeatureDto = {
  id: string;
  iconKey: string;
  label: string;
  description: string;
  status: ContentStatus;
  displayOrder: number;
};

export type AdminAboutSectionDto = {
  id: number;
  badgeLabel: string | null;
  heading: string;
  headingHighlight: string | null;
  body: string;
  imageOverlayTitle: string | null;
  imageOverlayText: string | null;
  whyUsHeading: string | null;
  whyUsHeadingHighlight: string | null;
  features: AdminAboutFeatureDto[];
  whyUsFeatures: AdminWhyUsFeatureDto[];
  updatedAt: string;
};

export type AdminSiteContent = {
  hero: AdminHeroSectionDto;
  about: AdminAboutSectionDto;
};

type HeroRow = Prisma.HeroSectionGetPayload<{
  include: { features: { orderBy: { displayOrder: "asc" } } };
}>;

type AboutRow = Prisma.AboutSectionGetPayload<{
  include: {
    features: { orderBy: { displayOrder: "asc" } };
    whyUsFeatures: { orderBy: { displayOrder: "asc" } };
  };
}>;

function toAdminHero(hero: HeroRow): AdminHeroSectionDto {
  return {
    id: hero.id,
    badgeText: hero.badgeText,
    headline: hero.headline,
    headlineHighlight: hero.headlineHighlight,
    subheadline: hero.subheadline,
    arabicTagline: hero.arabicTagline,
    badgeTitle: hero.badgeTitle,
    badgeSubtitle: hero.badgeSubtitle,
    ctaPrimaryText: hero.ctaPrimaryText,
    ctaPrimaryHref: hero.ctaPrimaryHref,
    ctaSecondaryText: hero.ctaSecondaryText,
    ctaSecondaryHref: hero.ctaSecondaryHref,
    features: hero.features.map((f) => ({
      id: f.id,
      iconKey: f.iconKey,
      label: f.label,
      status: f.status,
      displayOrder: f.displayOrder,
    })),
    updatedAt: hero.updatedAt.toISOString(),
  };
}

function toAdminAbout(about: AboutRow): AdminAboutSectionDto {
  return {
    id: about.id,
    badgeLabel: about.badgeLabel,
    heading: about.heading,
    headingHighlight: about.headingHighlight,
    body: about.body,
    imageOverlayTitle: about.imageOverlayTitle,
    imageOverlayText: about.imageOverlayText,
    whyUsHeading: about.whyUsHeading,
    whyUsHeadingHighlight: about.whyUsHeadingHighlight,
    features: about.features.map((f) => ({
      id: f.id,
      iconKey: f.iconKey,
      label: f.label,
      status: f.status,
      displayOrder: f.displayOrder,
    })),
    whyUsFeatures: about.whyUsFeatures.map((f) => ({
      id: f.id,
      iconKey: f.iconKey,
      label: f.label,
      description: f.description,
      status: f.status,
      displayOrder: f.displayOrder,
    })),
    updatedAt: about.updatedAt.toISOString(),
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

export const getAdminSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSiteContent> => {
    await requireSession();

    const [hero, about] = await Promise.all([
      prisma.heroSection.findFirst({
        include: { features: { orderBy: { displayOrder: "asc" } } },
      }),
      prisma.aboutSection.findFirst({
        include: {
          features: { orderBy: { displayOrder: "asc" } },
          whyUsFeatures: { orderBy: { displayOrder: "asc" } },
        },
      }),
    ]);
    if (!hero || !about) throw new Error("Site content not found");

    return { hero: toAdminHero(hero), about: toAdminAbout(about) };
  },
);

export const updateHeroSection = createServerFn({ method: "POST" })
  .validator(heroSectionInputSchema)
  .handler(async ({ data }): Promise<AdminHeroSectionDto> => {
    const session = await requireSession();

    const existing = await prisma.heroSection.findFirst();
    if (!existing) throw new Error("Hero section not found");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.heroFeature.deleteMany({ where: { heroId: existing.id } });
      return tx.heroSection.update({
        where: { id: existing.id },
        data: {
          badgeText: data.badgeText,
          headline: data.headline,
          headlineHighlight: data.headlineHighlight,
          subheadline: data.subheadline,
          arabicTagline: data.arabicTagline,
          badgeTitle: data.badgeTitle,
          badgeSubtitle: data.badgeSubtitle,
          ctaPrimaryText: data.ctaPrimaryText,
          ctaPrimaryHref: data.ctaPrimaryHref,
          ctaSecondaryText: data.ctaSecondaryText,
          ctaSecondaryHref: data.ctaSecondaryHref,
          features: {
            create: data.features.map((f, i) => ({
              iconKey: f.iconKey,
              label: f.label,
              displayOrder: i,
            })),
          },
        },
        include: { features: { orderBy: { displayOrder: "asc" } } },
      });
    });

    cached = null;
    await logActivity(session, "update", "hero_section", String(updated.id), {
      headline: updated.headline,
      featureCount: data.features.length,
    });

    return toAdminHero(updated);
  });

export const updateAboutSection = createServerFn({ method: "POST" })
  .validator(aboutSectionInputSchema)
  .handler(async ({ data }): Promise<AdminAboutSectionDto> => {
    const session = await requireSession();

    const existing = await prisma.aboutSection.findFirst();
    if (!existing) throw new Error("About section not found");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.aboutFeature.deleteMany({ where: { aboutId: existing.id } });
      await tx.whyUsFeature.deleteMany({ where: { aboutId: existing.id } });
      return tx.aboutSection.update({
        where: { id: existing.id },
        data: {
          badgeLabel: data.badgeLabel,
          heading: data.heading,
          headingHighlight: data.headingHighlight,
          body: data.body,
          imageOverlayTitle: data.imageOverlayTitle,
          imageOverlayText: data.imageOverlayText,
          whyUsHeading: data.whyUsHeading,
          whyUsHeadingHighlight: data.whyUsHeadingHighlight,
          features: {
            create: data.features.map((f, i) => ({
              iconKey: f.iconKey,
              label: f.label,
              displayOrder: i,
            })),
          },
          whyUsFeatures: {
            create: data.whyUsFeatures.map((f, i) => ({
              iconKey: f.iconKey,
              label: f.label,
              description: f.description,
              displayOrder: i,
            })),
          },
        },
        include: {
          features: { orderBy: { displayOrder: "asc" } },
          whyUsFeatures: { orderBy: { displayOrder: "asc" } },
        },
      });
    });

    cached = null;
    await logActivity(session, "update", "about_section", String(updated.id), {
      heading: updated.heading,
      featureCount: data.features.length,
      whyUsFeatureCount: data.whyUsFeatures.length,
    });

    return toAdminAbout(updated);
  });
