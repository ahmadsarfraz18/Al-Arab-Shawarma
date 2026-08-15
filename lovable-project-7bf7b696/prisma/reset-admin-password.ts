// -----------------------------------------------------------------------------
// Al-Arab Shawarma — Admin Password Reset (non-destructive)
//
// Resets ONLY the admin password (and its Better Auth credential account) to a
// new value supplied via the ADMIN_PASSWORD environment variable. No content is
// touched — unlike `prisma db seed`, which clears and recreates the whole site.
//
// Better Auth verifies email/password sign-in against the `credential` account
// row in the `accounts` table, so BOTH the user's password_hash and the
// account's password column are updated together.
//
// Run with:
//   $env:ADMIN_PASSWORD="<strong-password>"; npx tsx prisma/reset-admin-password.ts
// -----------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { seedData } from "./seed-data";

const prisma = new PrismaClient();

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.trim().length === 0) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required to reset the admin password. " +
        'Example (PowerShell): $env:ADMIN_PASSWORD="<strong-password>"; npx tsx prisma/reset-admin-password.ts',
    );
  }
  return password;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const passwordHash = hashPassword(requireAdminPassword());

  const user = await prisma.user.findUnique({ where: { email: seedData.user.email } });
  if (!user) {
    throw new Error(
      `No user found with email "${seedData.user.email}". Run \`prisma db seed\` first.`,
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: passwordHash },
    }),
  ]);

  console.log(`Admin password reset for ${seedData.user.email}.`);
  console.log("Sign in at /admin/login with the new ADMIN_PASSWORD value.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
