import { createFileRoute } from "@tanstack/react-router";

import { auth } from "../../../lib/auth/auth.server";

// Catch-all Better Auth API endpoint. Every /api/auth/* request is
// forwarded to the Better Auth handler, which dispatches internally
// (get-session, sign-in/email, sign-out, etc.).
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
      PUT: async ({ request }) => auth.handler(request),
      PATCH: async ({ request }) => auth.handler(request),
      DELETE: async ({ request }) => auth.handler(request),
      OPTIONS: async ({ request }) => auth.handler(request),
    },
  },
});
