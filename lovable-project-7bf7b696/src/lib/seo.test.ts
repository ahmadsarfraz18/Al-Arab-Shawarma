import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_SEO,
  buildHomeSeoHead,
  buildRestaurantJsonLd,
  parseAddress,
  robotsContent,
  type PublicSeoSettings,
  type SeoSiteInfo,
} from "./seo";

const SITE: SeoSiteInfo = {
  contact: {
    restaurantName: "Al-Arab Shawarma",
    address: "Main Sharfabad Signal, Karachi, Pakistan",
    phoneTel: "+92-333-3686848",
  },
  socialLinks: [{ url: "https://wa.me/923333686848" }, { url: "#" }, { url: "" }],
};

describe("robotsContent", () => {
  it("builds the four index/follow combinations", () => {
    assert.equal(robotsContent(true, true), "index, follow");
    assert.equal(robotsContent(false, true), "noindex, follow");
    assert.equal(robotsContent(true, false), "index, nofollow");
    assert.equal(robotsContent(false, false), "noindex, nofollow");
  });
});

describe("parseAddress", () => {
  it("splits a full Karachi address", () => {
    assert.deepEqual(parseAddress("Main Sharfabad Signal, Karachi, Pakistan"), {
      streetAddress: "Main Sharfabad Signal",
      addressLocality: "Karachi",
      addressRegion: "Sindh",
      addressCountry: "PK",
    });
  });

  it("falls back to Karachi when the address is a bare street", () => {
    const parsed = parseAddress("Main Sharfabad Signal");
    assert.equal(parsed.addressLocality, "Karachi");
    assert.equal(parsed.addressRegion, "Sindh");
    assert.equal(parsed.addressCountry, "PK");
  });
});

describe("buildRestaurantJsonLd", () => {
  const seo = FALLBACK_SEO;

  it("uses verified NAP from the site payload, not the stored JSON", () => {
    const node = buildRestaurantJsonLd(
      { ...seo, jsonLd: { ...(seo.jsonLd ?? {}), name: "Stale name", telephone: "0" } },
      SITE,
      "Mo-Su 16:00-04:00",
    );
    assert.equal(node.name, "Al-Arab Shawarma");
    assert.equal(node.telephone, "+92-333-3686848");
    const address = node.address as Record<string, unknown>;
    assert.equal(address.streetAddress, "Main Sharfabad Signal");
    assert.equal(address.addressLocality, "Karachi");
    assert.equal(address.addressRegion, "Sindh");
    assert.equal(address.addressCountry, "PK");
  });

  it("includes openingHours from the DB-derived string", () => {
    const node = buildRestaurantJsonLd(seo, SITE, "Mo-Su 16:00-04:00");
    assert.equal(node.openingHours, "Mo-Su 16:00-04:00");
  });

  it("only includes real social profiles in sameAs (drops placeholders)", () => {
    const node = buildRestaurantJsonLd(seo, SITE, "");
    assert.deepEqual(node.sameAs, ["https://wa.me/923333686848"]);
  });

  it("omits sameAs entirely when there are no real profiles", () => {
    const node = buildRestaurantJsonLd(seo, { ...SITE, socialLinks: [] }, "");
    assert.equal(node.sameAs, undefined);
  });

  it("includes url only when the canonical is absolute", () => {
    const abs = buildRestaurantJsonLd({ ...seo, canonicalUrl: "https://example.com/" }, SITE, "");
    assert.equal(abs.url, "https://example.com/");

    const rel = buildRestaurantJsonLd({ ...seo, canonicalUrl: "/" }, SITE, "");
    assert.equal(rel.url, undefined);
  });

  it("normalizes acceptsReservations string to a boolean", () => {
    const node = buildRestaurantJsonLd(
      { ...seo, jsonLd: { ...(seo.jsonLd ?? {}), acceptsReservations: "False" } },
      SITE,
      "",
    );
    assert.equal(node.acceptsReservations, false);
  });
});

describe("buildHomeSeoHead", () => {
  const seo: PublicSeoSettings = FALLBACK_SEO;

  const head = () => buildHomeSeoHead(seo, SITE, "Mo-Su 16:00-04:00");

  it("emits title, description, keywords and robots", () => {
    const m = head().meta;
    assert.ok(m.some((x) => x.title === seo.title));
    assert.ok(m.some((x) => x.name === "description" && x.content === seo.description));
    assert.ok(m.some((x) => x.name === "keywords" && x.content === seo.keywords));
    assert.ok(m.some((x) => x.name === "robots" && x.content === "index, follow"));
  });

  it("emits OG and Twitter metadata", () => {
    const m = head().meta;
    assert.ok(m.some((x) => x.property === "og:title" && x.content === seo.ogTitle));
    assert.ok(m.some((x) => x.property === "og:description" && x.content === seo.ogDescription));
    assert.ok(m.some((x) => x.property === "og:image" && x.content === seo.ogImageUrl));
    assert.ok(m.some((x) => x.name === "twitter:card" && x.content === "summary_large_image"));
    assert.ok(m.some((x) => x.name === "twitter:title" && x.content === seo.ogTitle));
    assert.ok(m.some((x) => x.name === "twitter:image" && x.content === seo.ogImageUrl));
  });

  it("emits a canonical link and a JSON-LD script", () => {
    const h = head();
    assert.deepEqual(h.links, [{ rel: "canonical", href: "/" }]);
    assert.equal(h.scripts.length, 1);
    assert.equal(h.scripts[0].type, "application/ld+json");
    const ld = JSON.parse(h.scripts[0].children as string);
    assert.equal(ld["@type"], "Restaurant");
  });

  it("renders noindex when robotsIndex is disabled", () => {
    const m = buildHomeSeoHead({ ...seo, robotsIndex: false }, SITE, "").meta;
    assert.ok(m.some((x) => x.name === "robots" && x.content === "noindex, follow"));
  });

  it("falls back og fields to the title/description when null", () => {
    const m = buildHomeSeoHead(
      { ...seo, ogTitle: null, ogDescription: null, twitterCard: null },
      SITE,
      "",
    ).meta;
    assert.ok(m.some((x) => x.property === "og:title" && x.content === seo.title));
    assert.ok(m.some((x) => x.name === "twitter:card" && x.content === "summary_large_image"));
  });

  it("omits keywords meta when keywords is null", () => {
    const m = buildHomeSeoHead({ ...seo, keywords: null }, SITE, "").meta;
    assert.ok(!m.some((x) => x.name === "keywords"));
  });

  it("produces identical head output for identical inputs (SSR/hydration-safe)", () => {
    const a = head();
    const b = head();
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });
});
