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

const TRUSTED_ORIGINS = [
  "https://alarabshawarma.pk",
  "https://www.alarabshawarma.pk",
  "https://al-arab-shawarma.vercel.app",
  "http://localhost:3000",
];

export const auth = betterAuth({
  secret,
  baseURL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  trustedOrigins: TRUSTED_ORIGINS,

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
    // No email/SMTP provider is configured on this single-owner site, so the
    // one-time reset link is surfaced to the server console (e.g. Vercel
    // function logs) and recorded in the activity log instead of emailed.
    sendResetPassword: async ({ user, url, token }) => {
      const origin = new URL(url).origin;
      const resetUrl = `${origin}/admin/reset-password?token=${token}`;
      console.info(`[auth] password reset link for ${user.email}: ${resetUrl}`);
      try {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "request_password_reset",
            entityType: "auth",
            entityId: user.id,
            details: { resetUrl },
          },
        });
      } catch (error) {
        console.error("[auth] failed to record reset link in activity log", error);
      }
    },
    onPasswordReset: async ({ user }) => {
      console.info(`[auth] password reset completed for ${user.email}`);
    },
    // Revoke every existing session once the password is reset, so a leaked
    // link can never keep a stale session alive.
    revokeSessionsOnPasswordReset: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
  },

  advanced: {
    // Secure cookies in production (HTTPS); plain cookies for local dev.
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "al_arab",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },

  plugins: [tanstackStartCookies()],
});
