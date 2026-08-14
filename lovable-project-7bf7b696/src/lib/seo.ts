// -----------------------------------------------------------------------------
// SEO — pure builders for search-engine metadata (no I/O, SSR-safe).
//
// All functions here are deterministic: given the same DB-derived inputs they
// produce identical output on the server and the client, so head() hydration
// never mismatches. Business facts (name, address, phone, hours) always come
// from the verified `site` payload; the SeoSettings `jsonLd` column only
// supplies non-identifying extras (cuisine, price range, area served, maps
// link). The hardcoded fallbacks below mirror the seeded row and are used only
// when the whole SeoSettings row is missing.
// -----------------------------------------------------------------------------

export type JsonLdValue =
  string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };

export type JsonLdObject = { [key: string]: JsonLdValue };

export type PublicSeoSettings = {
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
};

/** Public share image used today (kept as a safe fallback for the OG card). */
export const FALLBACK_OG_IMAGE_URL =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ee95f11d-64f1-4b94-9346-17e8a25e6918/id-preview-9e556af1--7bf7b696-d493-4899-8d3b-67eb73c8d30c.lovable.app-1781224475761.png";

/** Safe hardcoded fallback — only used when the SeoSettings row is missing. */
export const FALLBACK_SEO: PublicSeoSettings = {
  title: "Al-Arab Shawarma — Order Authentic Arabic Shawarma in Karachi",
  description:
    "Order fresh Arabic shawarma, wraps, platters & grill from Al-Arab Shawarma, Sharfabad Karachi. Delivery 4 PM – 2 AM all over Karachi. Easy WhatsApp ordering.",
  keywords:
    "Al-Arab Shawarma, shawarma Karachi, Arabic shawarma, wraps, platters, fast food delivery, Sharfabad, order online",
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: "Al-Arab Shawarma — Order Online in Karachi",
  ogDescription: "Authentic Arabic shawarma delivered across Karachi. Order via WhatsApp.",
  twitterCard: "summary_large_image",
  canonicalUrl: "/",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Al-Arab Shawarma",
    servesCuisine: ["Arabic", "Middle Eastern", "Fast Food"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Main Sharfabad Signal",
      addressLocality: "Karachi",
      addressRegion: "Sindh",
      addressCountry: "PK",
    },
    telephone: "+92-333-3686848",
    priceRange: "Rs. 30 – Rs. 1300",
    areaServed: "Karachi",
    hasMap: "https://www.google.com/maps?q=Sharfabad+Signal,+Karachi,+Pakistan",
    acceptsReservations: false,
  },
  ogImageUrl: FALLBACK_OG_IMAGE_URL,
};

/** "index, follow" / "noindex, nofollow" / etc. from the two DB booleans. */
export function robotsContent(index: boolean, follow: boolean): string {
  return `${index ? "index" : "noindex"}, ${follow ? "follow" : "nofollow"}`;
}

/**
 * Split a full address line like "Main Sharfabad Signal, Karachi, Pakistan"
 * into schema.org PostalAddress parts. Deterministic and derived only from the
 * stored address; never invents locations.
 */
export function parseAddress(full: string): {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string | null;
  addressCountry: string;
} {
  const parts = full
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const city = parts[parts.length - 2];
    const country = parts[parts.length - 1];
    return {
      streetAddress: parts.slice(0, parts.length - 2).join(", "),
      addressLocality: /karachi/i.test(city) ? "Karachi" : city,
      addressRegion: /karachi/i.test(city) ? "Sindh" : null,
      addressCountry: /pakistan/i.test(country) ? "PK" : country.slice(0, 2).toUpperCase(),
    };
  }
  if (parts.length === 2) {
    const [street, last] = parts;
    if (/karachi/i.test(last)) {
      return {
        streetAddress: street,
        addressLocality: "Karachi",
        addressRegion: "Sindh",
        addressCountry: "PK",
      };
    }
    return {
      streetAddress: street,
      addressLocality: last,
      addressRegion: null,
      addressCountry: "PK",
    };
  }
  return {
    streetAddress: parts[0] ?? "",
    addressLocality: "Karachi",
    addressRegion: "Sindh",
    addressCountry: "PK",
  };
}

/** Verified business facts + real social links used inside structured data. */
export type SeoSiteInfo = {
  contact: { restaurantName: string; address: string; phoneTel: string };
  socialLinks: Array<{ url: string }>;
};

/**
 * Build the Restaurant / LocalBusiness JSON-LD node. NAP (name/address/phone)
 * comes from the verified site payload; openingHours is derived from the DB;
 * sameAs only includes real profile URLs (placeholders like "#" are dropped);
 * `url` is included only when the configured canonical is absolute.
 */
export function buildRestaurantJsonLd(
  seo: PublicSeoSettings,
  site: SeoSiteInfo,
  ldOpeningHours: string,
): Record<string, unknown> {
  const base = seo.jsonLd ?? {};
  const contact = site.contact;
  const addr = parseAddress(contact.address);
  const canonical = seo.canonicalUrl ?? "/";
  const url = /^https?:\/\//.test(canonical) ? canonical : null;
  const sameAs = site.socialLinks
    .map((l) => (l.url ?? "").trim())
    .filter((u) => u !== "" && u !== "#");
  const rawReservations = base.acceptsReservations;
  const acceptsReservations =
    rawReservations === true ||
    rawReservations === "True" ||
    rawReservations === "true" ||
    rawReservations === "yes";

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    streetAddress: addr.streetAddress,
    addressLocality: addr.addressLocality,
    addressCountry: addr.addressCountry,
  };
  if (addr.addressRegion) address.addressRegion = addr.addressRegion;

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: contact.restaurantName,
    servesCuisine: Array.isArray(base.servesCuisine)
      ? base.servesCuisine
      : ["Arabic", "Middle Eastern", "Fast Food"],
    address,
    telephone: contact.phoneTel,
    priceRange:
      typeof base.priceRange === "string" && base.priceRange ? base.priceRange : undefined,
    areaServed: base.areaServed ?? "Karachi",
    hasMap: typeof base.hasMap === "string" ? base.hasMap : undefined,
    acceptsReservations,
  };

  if (ldOpeningHours) node.openingHours = ldOpeningHours;
  if (url) node.url = url;
  if (seo.ogImageUrl) node.image = seo.ogImageUrl;
  if (sameAs.length > 0) node.sameAs = sameAs;

  for (const key of Object.keys(node)) {
    if (node[key] === undefined) delete node[key];
  }
  return node;
}

export type SeoHeadResult = {
  title: string;
  meta: Array<Record<string, unknown>>;
  links: Array<Record<string, string>>;
  scripts: Array<Record<string, unknown>>;
};

/**
 * Everything the homepage <head> needs from SEO settings: title, description,
 * keywords, robots, canonical, Open Graph, Twitter and the JSON-LD script.
 * Render-level fallbacks (ogTitle -> title, twitterCard -> summary_large_image,
 * canonical -> "/") keep the output valid even when a field is null.
 */
export function buildHomeSeoHead(
  seo: PublicSeoSettings,
  site: SeoSiteInfo,
  ldOpeningHours: string,
): SeoHeadResult {
  const title = seo.title;
  const description = seo.description;
  const ogTitle = seo.ogTitle ?? title;
  const ogDescription = seo.ogDescription ?? description;
  const canonical = seo.canonicalUrl ?? "/";
  const ogImage = seo.ogImageUrl;

  const meta: Array<Record<string, unknown>> = [
    { title },
    { name: "description", content: description },
    ...(seo.keywords ? [{ name: "keywords", content: seo.keywords }] : []),
    { name: "robots", content: robotsContent(seo.robotsIndex, seo.robotsFollow) },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.contact.restaurantName },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
    { name: "twitter:card", content: seo.twitterCard ?? "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
    ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
  ];

  return {
    title,
    meta,
    links: [{ rel: "canonical", href: canonical }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildRestaurantJsonLd(seo, site, ldOpeningHours)),
      },
    ],
  };
}
