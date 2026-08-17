// -----------------------------------------------------------------------------
// One-time script: create or overwrite the admin user for Al-Arab Shawarma.
//
// Uses the same scrypt-based hashing as the seed and production auth:
//   scrypt$<salt-hex>$<hash-hex>
//
// Usage:
//   $env:ADMIN_PASSWORD="Mahar1814"; $env:DATABASE_URL="..."; npx tsx scripts/create-admin.ts
//
// This script:
//   1. Upserts a User with email ahmadsarfrazfreelancer@gmail.com
//   2. Upserts a credential Account row (required by Better Auth signIn.email)
//   3. Sets emailVerified = true
//   4. Hashes the password with scrypt (N=16384, r=8, p=1, dkLen=64)
// -----------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "ahmadsarfrazfreelancer@gmail.com";
const ADMIN_NAME = "Ahmad Sarfraz";

// ---------------------------------------------------------------------------
// Password hashing — identical to prisma/seed.ts and src/lib/auth/password.ts
// ---------------------------------------------------------------------------

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

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.trim().length === 0) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required.\n" +
        'Example (PowerShell): $env:ADMIN_PASSWORD="Mahar1814"; npx tsx scripts/create-admin.ts',
    );
  }

  const passwordHash = hashPassword(password);

  console.log(`Upserting admin user: ${ADMIN_EMAIL}`);

  // 1. Upsert the User row
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

  console.log(`  User ${user.id} (${user.email}) — created or updated.`);

  // 2. Upsert the credential Account row (Better Auth signIn.email reads this)
  //    First, find existing credential account if any.
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash },
    });
    console.log(`  Account ${existingAccount.id} — password hash updated.`);
  } else {
    await prisma.account.create({
      data: {
        id: randomAccountId(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
    console.log(`  Credential account created.`);
  }

  // 3. Clean up any stale credential accounts (duplicate rows)
  const staleAccounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      providerId: "credential",
      id: { not: existingAccount?.id ?? "__none__" },
    },
  });
  if (staleAccounts.length > 0) {
    await prisma.account.deleteMany({
      where: { id: { in: staleAccounts.map((a) => a.id) } },
    });
    console.log(`  Removed ${staleAccounts.length} stale credential account(s).`);
  }

  console.log("\nDone. Admin account is ready:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);
  console.log(`  Verified: true`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
