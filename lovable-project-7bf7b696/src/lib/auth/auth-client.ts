import { createAuthClient } from "better-auth/client";

// Client-side Better Auth instance. Reuses the existing /api/auth/* routes
// mounted by src/routes/api/auth/$.ts. No secrets live here — all session
// verification happens server-side via src/lib/auth/session.ts.
//
// In production the client must point at the same origin where the API routes
// are served. Better Auth auto-detects this from `window.location.origin`, but
// we also read a public env var so that builds previewed on a different URL
// (e.g. Vercel preview deployments) still hit the correct backend.
function getBaseURL(): string | undefined {
  try {
    const envUrl =
      (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_SITE_URL ??
      (import.meta as unknown as { env?: Record<string, unknown> }).env?.PUBLIC_SITE_URL;
    if (typeof envUrl === "string" && envUrl.trim() !== "") return envUrl.trim();
  } catch {
    // import.meta.env unavailable in some bundler contexts — ignore.
  }
  return undefined; // let Better Auth default to window.location.origin
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
