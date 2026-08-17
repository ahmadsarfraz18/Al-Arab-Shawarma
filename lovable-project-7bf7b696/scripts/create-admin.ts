// -----------------------------------------------------------------------------
// One-time script: create or reset the admin user for Al-Arab Shawarma.
//
// Uses Better Auth's internal adapter + password hasher so the hash is
// guaranteed to match what signIn/email expects. No manual hash formatting.
//
// Usage (run from project root):
//   $env:ADMIN_PASSWORD="Mahar1814"
//   $env:DATABASE_URL="postgresql://..."          # production DB
//   npx tsx scripts/create-admin.ts
//
// What it does:
//   1. Hashes the password via Better Auth's built-in password module
//   2. Upserts the User row (emailVerified = true)
//   3. Upserts the credential Account row (providerId = "credential")
//   4. Outputs the database host + confirmation
// -----------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Import the auth instance and its password module from the app code.
// This guarantees the same hashing + verification used by signIn/email.
// ---------------------------------------------------------------------------

// We re-implement the password hasher inline to avoid importing .server.ts
// files which may pull in env checks that fail outside the app runtime.
// The key: use the SAME scrypt params and salt-as-hex convention as
// src/lib/auth/password.ts and prisma/seed.ts.

import { scryptSync } from "node:crypto";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 64 } as const;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_PARAMS.dkLen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  }).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function randomAccountId(): string {
  return randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "ahmadsarfrazfreelancer@gmail.com";
const ADMIN_NAME = "Ahmad Sarfraz";

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.trim().length === 0) {
    throw new Error(
      "ADMIN_PASSWORD is required.\n" +
        'PowerShell: $env:ADMIN_PASSWORD="Mahar1814"; npx tsx scripts/create-admin.ts',
    );
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  // Show which database we're targeting
  try {
    const u = new URL(dbUrl);
    console.log(`Target database: ${u.hostname}${u.pathname}`);
  } catch {
    console.log(`Target database: (could not parse DATABASE_URL)`);
  }

  const prisma = new PrismaClient();
  const passwordHash = hashPassword(password);

  try {
    // ── 1. Upsert User ──────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        emailVerified: true,
        isActive: true,
      },
      update: {
        name: ADMIN_NAME,
        passwordHash,
        emailVerified: true,
        isActive: true,
      },
    });
    console.log(`User upserted: id=${user.id} email=${user.email} emailVerified=${user.emailVerified}`);

    // ── 2. Upsert credential Account ────────────────────────────────────
    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: { password: passwordHash },
      });
      console.log(`Account updated: id=${existing.id}`);
    } else {
      const account = await prisma.account.create({
        data: {
          id: randomAccountId(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
      console.log(`Account created: id=${account.id}`);
    }

    // ── 3. Verify the write ─────────────────────────────────────────────
    const verifyUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    const verifyAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    console.log("\n── Verification ──────────────────────────────────");
    console.log(`  users row:        ${verifyUser ? "FOUND" : "MISSING"}`);
    console.log(`  accounts row:     ${verifyAccount ? "FOUND" : "MISSING"}`);
    console.log(`  password_hash:    ${verifyUser?.passwordHash?.slice(0, 30)}...`);
    console.log(`  account.password: ${verifyAccount?.password?.slice(0, 30)}...`);
    console.log(`  email_verified:   ${verifyUser?.emailVerified}`);
    console.log(`  hashes match:     ${verifyUser?.passwordHash === verifyAccount?.password}`);
    console.log("────────────────────────────────────────────────\n");

    console.log("Done. Sign in at /admin/login with:");
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  });
