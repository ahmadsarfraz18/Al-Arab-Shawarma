// -----------------------------------------------------------------------------
// Al-Arab Shawarma — Database Seed (Phase 1)
//
// Idempotent: clears every table in FK-safe order, then recreates the full
// website content (admin user, menu, singleton sections, delivery, etc.)
// from prisma/seed-data.ts.
//
// Run with:  npx prisma db seed
//
// The admin password is read from the ADMIN_PASSWORD environment variable.
// It must NEVER be hardcoded in this repository. The seed fails fast with a
// clear error if ADMIN_PASSWORD is not set.
// -----------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { seedData } from "./seed-data";

// Better Auth signs the owner in through the `accounts` table: signIn/email
// (src/lib/auth/auth.server.ts -> better-auth) looks up a row where
// providerId = "credential" and verifies the password against its `password`
// column. Without that row the login always fails with
// "Invalid email or password", even though users.password_hash is set.
// See node_modules/better-auth/dist/api/routes/sign-in.mjs.
const ACCOUNT_ID_LENGTH = 24;

function randomAccountId(): string {
  return randomBytes(ACCOUNT_ID_LENGTH).toString("base64url");
}

const prisma = new PrismaClient();

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.trim().length === 0) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required to seed the admin user. " +
        "Set it before running `npx prisma db seed`. " +
        'Example (PowerShell): $env:ADMIN_PASSWORD="<strong-password>"; npx prisma db seed',
    );
  }
  return password;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/[()]/g, "");
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function time(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

async function main() {
  console.log("Clearing existing data…");

  // Delete in FK order (children before parents).
  await prisma.menuItemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.heroFeature.deleteMany();
  await prisma.heroSection.deleteMany();
  await prisma.aboutFeature.deleteMany();
  await prisma.whyUsFeature.deleteMany();
  await prisma.aboutSection.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.socialLink.deleteMany();
  await prisma.deliveryArea.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.paymentSettings.deleteMany();
  await prisma.themeSettings.deleteMany();
  await prisma.seoSettings.deleteMany();
  await prisma.contactInfo.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.media.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding admin user…");
  const adminPassword = requireAdminPassword();
  const passwordHash = hashPassword(adminPassword);
  const user = await prisma.user.create({
    data: {
      name: seedData.user.name,
      email: seedData.user.email,
      passwordHash,
    },
  });

  // Credential account required by Better Auth for email+password sign-in.
  // accountId mirrors Better Auth's own convention (the user's id); the
  // password is stored only as the same scrypt hash as password_hash.
  await prisma.account.create({
    data: {
      id: randomAccountId(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  console.log("Seeding menu (categories + items + variants)…");
  const usedSlugs = new Set<string>();
  const uniqueSlug = (base: string) => {
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${i}`;
      i += 1;
    }
    usedSlugs.add(slug);
    return slug;
  };

  for (const [catIndex, cat] of seedData.categories.entries()) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: uniqueSlug(slugify(cat.name)),
        displayOrder: catIndex,
      },
    });

    for (const [itemIndex, item] of cat.items.entries()) {
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          slug: uniqueSlug(slugify(item.name)),
          description: item.description,
          basePrice: item.price,
          displayOrder: itemIndex,
          variants: item.sizes
            ? {
                create: item.sizes.map((s, i) => ({
                  label: s.label,
                  price: s.price,
                  displayOrder: i,
                })),
              }
            : undefined,
        },
      });
    }
  }

  console.log("Seeding hero section…");
  await prisma.heroSection.create({
    data: {
      badgeText: seedData.hero.badgeText,
      headline: seedData.hero.headline,
      headlineHighlight: seedData.hero.headlineHighlight,
      subheadline: seedData.hero.subheadline,
      arabicTagline: seedData.hero.arabicTagline,
      badgeTitle: seedData.hero.badgeTitle,
      badgeSubtitle: seedData.hero.badgeSubtitle,
      ctaPrimaryText: seedData.hero.ctaPrimaryText,
      ctaPrimaryHref: seedData.hero.ctaPrimaryHref,
      ctaSecondaryText: seedData.hero.ctaSecondaryText,
      ctaSecondaryHref: seedData.hero.ctaSecondaryHref,
      features: {
        create: seedData.hero.features.map((f, i) => ({
          iconKey: f.iconKey,
          label: f.label,
          displayOrder: i,
        })),
      },
    },
  });

  console.log("Seeding about section…");
  await prisma.aboutSection.create({
    data: {
      badgeLabel: seedData.about.badgeLabel,
      heading: seedData.about.heading,
      headingHighlight: seedData.about.headingHighlight,
      body: seedData.about.body,
      imageOverlayTitle: seedData.about.imageOverlayTitle,
      imageOverlayText: seedData.about.imageOverlayText,
      whyUsHeading: seedData.about.whyUsHeading,
      whyUsHeadingHighlight: seedData.about.whyUsHeadingHighlight,
      features: {
        create: seedData.about.features.map((f, i) => ({
          iconKey: f.iconKey,
          label: f.label,
          displayOrder: i,
        })),
      },
      whyUsFeatures: {
        create: seedData.about.whyUsFeatures.map((f, i) => ({
          iconKey: f.iconKey,
          label: f.label,
          description: f.description,
          displayOrder: i,
        })),
      },
    },
  });

  console.log("Seeding contact info…");
  await prisma.contactInfo.create({
    data: {
      restaurantName: seedData.contact.restaurantName,
      tagline: seedData.contact.tagline,
      phoneDisplay: seedData.contact.phoneDisplay,
      phoneTel: seedData.contact.phoneTel,
      whatsappNumber: seedData.contact.whatsappNumber,
      address: seedData.contact.address,
      email: seedData.contact.email,
      mapsEmbedUrl: seedData.contact.mapsEmbedUrl,
      mapsDirectionsUrl: seedData.contact.mapsDirectionsUrl,
    },
  });

  console.log("Seeding opening hours…");
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    for (const slot of seedData.openingHours) {
      await prisma.openingHours.create({
        data: {
          dayOfWeek: day,
          type: slot.type,
          openTime: time(slot.openTime),
          closeTime: time(slot.closeTime),
          isClosed: false,
        },
      });
    }
  }

  console.log("Seeding social links…");
  for (const [i, link] of seedData.socialLinks.entries()) {
    await prisma.socialLink.create({
      data: {
        platform: link.platform,
        url: link.url,
        iconKey: link.iconKey,
        displayOrder: i,
      },
    });
  }

  console.log("Seeding SEO settings…");
  await prisma.seoSettings.create({
    data: {
      title: seedData.seo.title,
      description: seedData.seo.description,
      keywords: seedData.seo.keywords,
      robotsIndex: seedData.seo.robotsIndex,
      robotsFollow: seedData.seo.robotsFollow,
      ogTitle: seedData.seo.ogTitle,
      ogDescription: seedData.seo.ogDescription,
      twitterCard: seedData.seo.twitterCard,
      canonicalUrl: seedData.seo.canonicalUrl,
      jsonLd: seedData.seo.jsonLd,
    },
  });

  console.log("Seeding theme settings…");
  await prisma.themeSettings.create({
    data: {
      primaryColor: seedData.theme.primaryColor,
      secondaryColor: seedData.theme.secondaryColor,
      accentColor: seedData.theme.accentColor,
      backgroundColor: seedData.theme.backgroundColor,
      textColor: seedData.theme.textColor,
      isActive: seedData.theme.isActive,
    },
  });

  console.log("Seeding payment settings…");
  await prisma.paymentSettings.create({
    data: {
      easypaisaNumber: seedData.payment.easypaisaNumber,
      easypaisaTitle: seedData.payment.easypaisaTitle,
      bankName: seedData.payment.bankName,
      bankTitle: seedData.payment.bankTitle,
      bankIban: seedData.payment.bankIban,
      paymentNote: seedData.payment.paymentNote,
    },
  });

  console.log("Seeding delivery zones…");
  for (const [zoneIndex, zone] of seedData.zones.entries()) {
    await prisma.deliveryZone.create({
      data: {
        name: zone.name,
        deliveryCharge: zone.charge,
        displayOrder: zoneIndex,
        areas: {
          create: zone.areas.map((a) => ({ name: a })),
        },
      },
    });
  }

  console.log("Seeding activity log…");
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "seed",
      entityType: "system",
      entityId: user.id,
      details: { message: "Database seeded with initial website content" },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
