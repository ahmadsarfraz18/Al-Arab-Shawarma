import { createAuthClient } from "better-auth/client";

// Client-side Better Auth instance. Reuses the existing /api/auth/* routes
// mounted by src/routes/api/auth/$.ts. No secrets live here — all session
// verification happens server-side via src/lib/auth/session.ts.
export const authClient = createAuthClient();
