import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { prisma } from "../server/prisma";
import { hashPassword, verifyPassword } from "./password";

// Server-only Better Auth instance for the admin dashboard.
// The `.server.ts` suffix keeps this file out of the client bundle.
//
// Secrets are read from environment variables only — never hardcoded.
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.trim() === "") {
  throw new Error("BETTER_AUTH_SECRET is not set. Generate one with: openssl rand -base64 32");
}

const baseURL = process.env.BETTER_AUTH_URL?.trim() || undefined;

export const auth = betterAuth({
  secret,
  baseURL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // The single owner account already exists; self-service sign up is off.
    disableSignUp: true,
    requireEmailVerification: false,
    // Reproduce the existing `scrypt$<salt>$<hash>` hashes.
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
  },

  advanced: {
    // Secure cookies in production (HTTPS); plain cookies for local dev.
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "al_arab",
  },

  plugins: [tanstackStartCookies()],
});
