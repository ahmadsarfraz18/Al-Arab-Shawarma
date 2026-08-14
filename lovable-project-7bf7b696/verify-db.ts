import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const seo = await prisma.seoSettings.findFirst();
  const contact = await prisma.contactInfo.findFirst();
  const users = await prisma.user.count();
  console.log(
    JSON.stringify(
      { ok: true, seoId: seo?.id ?? null, contactId: contact?.id ?? null, users },
      null,
      2,
    ),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String((err as Error).message) }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
