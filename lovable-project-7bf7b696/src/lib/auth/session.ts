import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "./auth.server";

// Server-side session lookup used by route guards (beforeLoad) and any
// protected server logic. It reads the current request cookies and verifies
// them against the database — never trusts the client.
//
// Safe to import from client code: the handler body (and its imports) are
// stripped from the client bundle by the server-functions compiler, so the
// `auth` instance and Prisma never reach the browser.
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = await getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  return session;
});
