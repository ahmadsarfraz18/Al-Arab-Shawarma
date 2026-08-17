import { createFileRoute } from "@tanstack/react-router";

import { auth } from "../../../lib/auth/auth.server";

// Trusted origins list — must match auth.server.ts trustedOrigins.
const ALLOWED_ORIGINS = new Set([
  "https://alarabshawarma.pk",
  "https://www.alarabshawarma.pk",
  "https://al-arab-shawarma.vercel.app",
  "http://localhost:3000",
]);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function withCors(
  handler: (request: Request) => Promise<Response>,
): (args: { request: Request }) => Promise<Response> {
  return async ({ request }) => {
    const origin = request.headers.get("origin") ?? "";

    // Always handle OPTIONS preflight.
    if (request.method === "OPTIONS") {
      const headers: Record<string, string> = { ...CORS_HEADERS };
      if (ALLOWED_ORIGINS.has(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
      }
      return new Response(null, { status: 204, headers });
    }

    const response = await handler(request);

    // Clone to mutate headers (Response is immutable).
    const corsResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      corsResponse.headers.set(key, value);
    }
    if (ALLOWED_ORIGINS.has(origin)) {
      corsResponse.headers.set("Access-Control-Allow-Origin", origin);
    }

    return corsResponse;
  };
}

const handleAuth = withCors((request) => auth.handler(request));

// Catch-all Better Auth API endpoint. Every /api/auth/* request is
// forwarded to the Better Auth handler, which dispatches internally
// (get-session, sign-in/email, sign-out, etc.).
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuth,
      POST: handleAuth,
      PUT: handleAuth,
      PATCH: handleAuth,
      DELETE: handleAuth,
      OPTIONS: handleAuth,
    },
  },
});
