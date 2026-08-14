// -----------------------------------------------------------------------------
// Site base URL helpers.
//
// The public homepage renders absolute canonical / og:url / JSON-LD url, and
// /robots.txt + /sitemap.xml need the absolute origin. The production origin is
// environment-driven so it is never hardcoded in source.
//
// For head() (which runs on the server AND the client during hydration /
// navigation) the value must be identical on both sides, so prefer the PUBLIC
// VITE_SITE_URL (inlined at build time) or SITE_URL/BETTER_AUTH_URL (server
// env). Server-only routes may additionally fall back to the request origin.
// -----------------------------------------------------------------------------

function readServerEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[name];
    if (value && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function readPublicEnv(name: string): string | undefined {
  try {
    const value = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[name];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  } catch {
    // import.meta.env is unavailable (e.g. some non-Vite consumers) — ignore.
  }
  return undefined;
}

/**
 * Canonical site origin (scheme://host, no trailing slash) or "" when unknown.
 * Deterministic and safe to call from server and client code.
 */
export function getSiteBaseUrl(): string {
  const raw =
    readServerEnv("SITE_URL") ??
    readPublicEnv("VITE_SITE_URL") ??
    readPublicEnv("PUBLIC_SITE_URL") ??
    readServerEnv("BETTER_AUTH_URL") ??
    "";
  return raw.replace(/\/+$/, "");
}

/**
 * Server-route variant: same env resolution as getSiteBaseUrl(), but when no
 * origin is configured it falls back to the current request's origin so that
 * robots.txt / sitemap.xml always return absolute URLs.
 */
export function getRequestBaseUrl(request?: Request): string {
  const fromEnv = getSiteBaseUrl();
  if (fromEnv) return fromEnv;
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Malformed request URL — fall through.
    }
  }
  return "";
}
