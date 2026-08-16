import process from "node:process";

import { PrismaClient } from "@prisma/client";

import { requireDatabaseUrl } from "../config.server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = requireDatabaseUrl();

  const url = new URL(databaseUrl);
  const isPooler = url.port === "6543" || url.hostname.includes("pooler");

  if (isPooler) {
    url.searchParams.set("pgbouncer", "true");
  }

  url.searchParams.set("connection_limit", "5");
  url.searchParams.set("pool_timeout", "10");

  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
