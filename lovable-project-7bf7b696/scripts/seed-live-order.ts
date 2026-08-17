// ---------------------------------------------------------------------------
// Permanent seed: inserts 1 test order into the live production DB.
//
// Usage (run from project root):
//   $env:DATABASE_URL="postgresql://..."
//   npx tsx scripts/seed-live-order.ts
//
// This order is NOT deleted — it remains in the DB so the admin dashboard
// and orders page can be verified immediately.
// ---------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const dbHost = new URL(process.env.DATABASE_URL!).hostname;
  console.log("Connecting to:", dbHost);

  // Check if a seed order already exists
  const existing = await prisma.order.findFirst({
    where: { customerName: "Seed Test Order" },
  });
  if (existing) {
    console.log("Seed order already exists:", existing.id, "Order #", existing.orderNumber);
    console.log("Skipping insert.");
    return;
  }

  const order = await prisma.order.create({
    data: {
      customerName: "Seed Test Order",
      customerPhone: "03000000000",
      customerAddress: "Seed Address, Lahore (permanent test order)",
      customerNotes: "Created by seed-live-order.ts — safe to delete",
      areaLabel: "Test Area",
      deliveryCharge: 100,
      subtotal: 750,
      total: 850,
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "pending",
      items: {
        create: [
          {
            name: "Shawarma Plate (Seed)",
            quantity: 3,
            unitPrice: 250,
            total: 750,
            size: "Regular",
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log("Seed order created:");
  console.log("  id:", order.id);
  console.log("  orderNumber:", order.orderNumber);
  console.log("  total:", order.total);
  console.log("  status:", order.status);
  console.log("  items:", order.items.length);
  console.log("");
  console.log("Verify at: https://alarabshawarma.pk/admin/orders");
}

main()
  .catch((err) => {
    console.error("SEED FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
