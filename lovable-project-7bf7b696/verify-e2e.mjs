// ---------------------------------------------------------------------------
// Phase 3 Feature #7 — FINAL RUNTIME E2E VERIFICATION (temporary script)
// Exercises the REAL production paths: better-auth login, TanStack server
// functions (getAdminSiteSettings / updateSeoSettings), SSR homepage head,
// and Prisma ground-truth reads. No code under test is modified.
// ---------------------------------------------------------------------------
import { PrismaClient } from "@prisma/client";
import { toJSONAsync, fromCrossJSON } from "seroval";
import { defaultSerovalPlugins } from "@tanstack/router-core";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const EMAIL = "owner@al-arbalshawarma.com";
const PASSWORD = "Ownerowner@123";
const MARKER = "AL-ARAB-VERIF-TEMP-42";

const prisma = new PrismaClient();
const jar = new Map();
const report = { steps: [] };
const log = (step, ok, detail) => {
  report.steps.push({ step, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${step}`);
  if (detail !== undefined) console.log("      " + String(detail));
};

function saveCookie(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const name = c.split("=")[0].trim();
    const value = c.split(/=(.*)/s)[1].split(";")[0].trim();
    jar.set(name, value);
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function mergeCookie(headers) {
  if (jar.size > 0) headers.cookie = cookieHeader();
  return headers;
}

async function get(url, headers = {}) {
  const res = await fetch(BASE + url, { headers: mergeCookie(headers) });
  saveCookie(res);
  return res;
}
async function post(url, body, headers = {}) {
  const res = await fetch(BASE + url, {
    method: "POST",
    headers: mergeCookie(headers),
    body,
  });
  saveCookie(res);
  return res;
}

async function callServerFn(id, method, data) {
  const headers = {
    "x-tsr-serverFn": "true",
    accept: "application/x-tss-framed, application/x-ndjson, application/json",
  };
  let res;
  if (method === "GET") {
    res = await get(`/_serverFn/${id}`, headers);
  } else {
    const serialized = JSON.stringify(await toJSONAsync({ data }, { plugins: defaultSerovalPlugins }));
    res = await post(`/_serverFn/${id}`, serialized, {
      ...headers,
      "content-type": "application/json",
    });
  }
  const contentType = res.headers.get("content-type") ?? "";
  const isSerialized = res.headers.get("x-tss-serialized") === "true";
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`serverFn ${method} ${id} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  let envelope;
  if (contentType.includes("application/x-tss-framed")) {
    const buf = Buffer.from(await res.arrayBuffer());
    const jsonChunks = [];
    let offset = 0;
    while (offset + 9 <= buf.length) {
      const type = buf[offset];
      const length = buf.readUInt32BE(offset + 5);
      jsonChunks.push(buf.subarray(offset + 9, offset + 9 + length).toString("utf8"));
      offset += 9 + length;
    }
    const lines = jsonChunks.join("").split("\n").filter((l) => l.trim());
    envelope = fromCrossJSON(JSON.parse(lines[0]), { plugins: defaultSerovalPlugins });
  } else if (isSerialized) {
    envelope = fromCrossJSON(await res.json(), { plugins: defaultSerovalPlugins });
  } else {
    envelope = await res.json();
  }
  if (envelope?.error) throw new Error(`serverFn returned error: ${JSON.stringify(envelope.error)}`);
  return envelope?.result ?? envelope;
}

// ---------------------------------------------------------------------------
try {
  // Step 1 — login (browser sends Origin on POST; better-auth validates it)
  const loginRes = await post("/api/auth/sign-in/email", JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    "content-type": "application/json",
    origin: BASE,
    referer: `${BASE}/admin/login`,
  });
  const loginBody = await loginRes.text();
  log("1. login POST /api/auth/sign-in/email", loginRes.status === 200, `status=${loginRes.status} body=${loginBody.slice(0, 200)}`);
  const sessionCookieNames = [...jar.keys()];
  log("1b. session cookie captured", sessionCookieNames.length > 0, sessionCookieNames.join(", "));

  // Step 2 — admin page loads with session
  const admin = await get("/admin/settings");
  const adminHtml = await admin.text();
  const adminOk =
    admin.status === 200 &&
    !admin.headers.get("location") &&
    !/Admin Login/i.test(adminHtml.slice(0, 3000)) &&
    /Al-Arab\s*Admin|Settings|seo/i.test(adminHtml.slice(0, 3000));
  log("2. GET /admin/settings authenticated", adminOk, `status=${admin.status} len=${adminHtml.length}`);

  // Step 3 — extract server-fn ids from the transformed module
  const mod = await get("/src/lib/api/site-settings.functions.ts");
  const modText = await mod.text();
  const idOf = (name) => {
    const re = new RegExp(`export const ${name} = createServerFn\\([^]*?createClientRpc\\("([^"]+)"\\)`);
    const m = modText.match(re);
    if (!m) throw new Error(`cannot find fn id for ${name}`);
    return m[1];
  };
  const getAdminId = idOf("getAdminSiteSettings");
  const updateSeoId = idOf("updateSeoSettings");
  log("3. extracted server-fn ids", Boolean(getAdminId && updateSeoId));

  // Step 4 — read ORIGINAL SEO settings (admin DTO + Prisma ground truth)
  const adminSettings = await callServerFn(getAdminId, "GET");
  const originalDto = JSON.parse(JSON.stringify(adminSettings.seo));
  const originalRow = await prisma.seoSettings.findFirst({ include: { ogImage: true } });
  const originalJsonLd = originalRow.jsonLd ?? null;
  writeFileSync("C:\\Users\\user\\AppData\\Local\\Temp\\opencode\\seo-originals.json", JSON.stringify({ originalDto, originalRow }, null, 2));
  log("4. original SEO settings recorded", Boolean(originalDto.title), `title="${originalDto.title}"`);

  // Step 5 — temporarily update SEO values via the real server fn
  const temp = {
    title: `${MARKER} TITLE`,
    description: `${MARKER} description for SSR verification run`,
    keywords: "verif,temp,al-arab-shawarma",
    robotsIndex: false,
    robotsFollow: false,
    ogTitle: `${MARKER} OG TITLE`,
    ogDescription: `${MARKER} OG description`,
    twitterCard: "summary_large_image",
    canonicalUrl: "https://verif-temp.example/placeholder",
    jsonLd: { ...originalJsonLd, servesCuisine: [MARKER, "Temp"], verificationMarker: MARKER },
  };
  const updated = await callServerFn(updateSeoId, "POST", temp);
  log("5. updateSeoSettings applied", updated.title === temp.title, `new title="${updated.title}"`);

  // Step 6 — verify DB persistence (Prisma ground truth)
  const persisted = await prisma.seoSettings.findFirst();
  const persistedOk =
    persisted.title === temp.title &&
    persisted.description === temp.description &&
    persisted.robotsIndex === false &&
    persisted.robotsFollow === false &&
    persisted.canonicalUrl === temp.canonicalUrl &&
    persisted.jsonLd?.verificationMarker === MARKER;
  log("6. DB persistence verified (Prisma)", persistedOk);

  // Step 6b — reload admin page (session persists), re-read via server fn
  const admin2 = await get("/admin/settings");
  log("6b. admin reload after save", admin2.status === 200, `status=${admin2.status}`);
  const adminSettings2 = await callServerFn(getAdminId, "GET");
  log("6b2. admin DTO reflects temp values", adminSettings2.seo.title === temp.title, `title="${adminSettings2.seo.title}"`);

  // Step 7 — public homepage SSR <head>
  const home = await get("/");
  const html = await home.text();
  log("7. public homepage SSR 200", home.status === 200, `status=${home.status} len=${html.length}`);

  const grab = (re) => {
    const m = html.match(re);
    return m ? m[1] : null;
  };
  const title = grab(/<title[^>]*>([\s\S]*?)<\/title>/);
  const metaDesc = grab(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const metaKeywords = grab(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i);
  const robots = grab(/<meta[^>]*name="robots"[^>]*content="([^"]*)"[^>]*>/i);
  const canonical = grab(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);
  const ogTitle = grab(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  const ogDesc = grab(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  const ogType = grab(/<meta[^>]*property="og:type"[^>]*content="([^"]*)"[^>]*>/i);
  const ogSite = grab(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i);
  const ogImage = grab(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
  const twCard = grab(/<meta[^>]*name="twitter:card"[^>]*content="([^"]*)"[^>]*>/i);
  const twTitle = grab(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"[^>]*>/i);
  const twDesc = grab(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"[^>]*>/i);
  const twImage = grab(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);

  log("8. title updated in SSR", title?.includes(MARKER), `title="${title}"`);
  log("8. meta description updated", metaDesc?.includes(MARKER), `desc="${metaDesc}"`);
  log("8. keywords updated", metaKeywords?.includes("verif,temp"), `keywords="${metaKeywords}"`);
  log("8. robots noindex/nofollow", robots === "noindex, nofollow", `robots="${robots}"`);
  log("8. canonical updated", canonical === temp.canonicalUrl, `canonical="${canonical}"`);
  log("8. og:title updated", ogTitle?.includes(MARKER), `og:title="${ogTitle}"`);
  log("8. og:description updated", ogDesc?.includes(MARKER), `og:description="${ogDesc}"`);
  log("8. og:type present", ogType !== null, `og:type="${ogType}"`);
  log("8. og:site_name present", ogSite !== null, `og:site_name="${ogSite}"`);
  log("8. og:image present", ogImage !== null, `og:image="${ogImage}"`);
  log("8. twitter:card updated", twCard === "summary_large_image", `twitter:card="${twCard}"`);
  log("8. twitter:title updated", twTitle?.includes(MARKER), `twitter:title="${twTitle}"`);
  log("8. twitter:description updated", twDesc?.includes(MARKER), `twitter:description="${twDesc}"`);
  log("8. twitter:image present", twImage !== null, `twitter:image="${twImage}"`);

  // Step 9 — JSON-LD
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  let ld = null;
  let ldValid = false;
  if (ldMatch) {
    try {
      ld = JSON.parse(ldMatch[1]);
      ldValid = true;
    } catch (e) {
      ldValid = false;
    }
  }
  log("9. JSON-LD present & valid JSON", ldValid);
  if (ldValid) {
    log("9. JSON-LD @type=Restaurant", ld["@type"] === "Restaurant", `@type="${ld["@type"]}"`);
    log("9. JSON-LD carries temp marker", Array.isArray(ld.servesCuisine) && ld.servesCuisine.includes(MARKER), `servesCuisine="${JSON.stringify(ld.servesCuisine)}"`);
    log(
      "9. JSON-LD has real business data",
      Boolean(ld.name && ld.address && ld.telephone && ld.openingHours),
      `name="${ld.name}" phone="${ld.telephone}" address="${JSON.stringify(ld.address)}"`,
    );
    log("9. JSON-LD servesCuisine present", Boolean(ld.servesCuisine), `servesCuisine="${JSON.stringify(ld.servesCuisine)}"`);
  }

  // Step 10 — restore EXACT original values via the real server fn
  const restore = await callServerFn(updateSeoId, "POST", {
    title: originalDto.title,
    description: originalDto.description,
    keywords: originalDto.keywords,
    robotsIndex: originalDto.robotsIndex,
    robotsFollow: originalDto.robotsFollow,
    ogTitle: originalDto.ogTitle,
    ogDescription: originalDto.ogDescription,
    twitterCard: originalDto.twitterCard,
    canonicalUrl: originalDto.canonicalUrl,
    jsonLd: originalJsonLd,
  });
  log("10. original values restored via updateSeoSettings", restore.title === originalDto.title, `title="${restore.title}"`);

  // Step 11 — verify restoration (Prisma + admin DTO + public SSR)
  const after = await prisma.seoSettings.findFirst();
  const restoredOk =
    after.title === originalRow.title &&
    after.description === originalRow.description &&
    after.keywords === originalRow.keywords &&
    after.robotsIndex === originalRow.robotsIndex &&
    after.robotsFollow === originalRow.robotsFollow &&
    after.ogTitle === originalRow.ogTitle &&
    after.ogDescription === originalRow.ogDescription &&
    after.twitterCard === originalRow.twitterCard &&
    after.canonicalUrl === originalRow.canonicalUrl &&
    JSON.stringify(after.jsonLd) === JSON.stringify(originalJsonLd);
  log("11. Prisma row fully restored (deep equal)", restoredOk);
  const admin3 = await get("/admin/settings");
  log("11b. admin reload after restore", admin3.status === 200, `status=${admin3.status}`);
  const adminSettings3 = await callServerFn(getAdminId, "GET");
  log("11c. admin DTO restored", adminSettings3.seo.title === originalDto.title, `title="${adminSettings3.seo.title}"`);
  const home2 = await get("/");
  const html2 = await home2.text();
  const title2 = html2.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
  log("11d. public SSR title restored", title2 === originalDto.title, `title="${title2}"`);
  const robots2 = html2.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"[^>]*>/i)?.[1];
  log(
    "11e. robots restored",
    robots2 === (originalDto.robotsIndex && originalDto.robotsFollow ? "index, follow" : "noindex, nofollow"),
    `robots="${robots2}"`,
  );

  report.ok = report.steps.every((s) => s.ok);
  report.originalTitle = originalDto.title;
  report.canonicalAfterRestore = after.canonicalUrl === originalRow.canonicalUrl;
} catch (err) {
  report.ok = false;
  report.fatal = String(err?.stack ?? err);
  console.error("FATAL:", err);
} finally {
  await prisma.$disconnect();
  writeFileSync("C:\\Users\\user\\AppData\\Local\\Temp\\opencode\\e2e-report.json", JSON.stringify(report, null, 2));
  console.log("\n=== E2E " + (report.ok ? "ALL PASS" : "HAS FAILURES") + " ===");
}
