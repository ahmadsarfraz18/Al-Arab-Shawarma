// ---------------------------------------------------------------------------
// Test script: create a test order directly against the live production DB.
//
// Usage (run from project root):
//   $env:DATABASE_URL="postgresql://..."
//   npx tsx scripts/test-order.ts
//
// What it does:
//   1. Connects to the database via Prisma
//   2. Creates a test order with items
//   3. Reads it back and confirms fields
//   4. Cleans up (deletes the test order)
//   5. Outputs results
// ---------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  console.log("DATABASE_URL host:", new URL(process.env.DATABASE_URL!).hostname);
  console.log("---");

  // 1. Create a test order
  console.log("Creating test order...");
  const order = await prisma.order.create({
    data: {
      customerName: "Test Customer",
      customerPhone: "03001234567",
      customerAddress: "Test Address, Lahore",
      customerNotes: "Test order - will be deleted",
      areaLabel: "Test Area",
      deliveryCharge: 100,
      subtotal: 500,
      total: 600,
      paymentMethod: "cod",
      transactionRef: null,
      items: {
        create: [
          {
            name: "Shawarma Plate",
            quantity: 2,
            unitPrice: 250,
            total: 500,
            size: "Regular",
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log("Order created successfully!");
  console.log("  id:", order.id);
  console.log("  orderNumber:", order.orderNumber);
  console.log("  customerName:", order.customerName);
  console.log("  total:", order.total);
  console.log("  paymentMethod:", order.paymentMethod);
  console.log("  paymentStatus:", order.paymentStatus);
  console.log("  status:", order.status);
  console.log("  items:", order.items.length);
  if (order.items[0]) {
    console.log("    item[0].name:", order.items[0].name);
    console.log("    item[0].unitPrice:", order.items[0].unitPrice);
    console.log("    item[0].total:", order.items[0].total);
    console.log("    item[0].size:", order.items[0].size);
  }
  console.log("---");

  // 2. Read it back
  console.log("Reading order back...");
  const found = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true },
  });
  console.log("  Found:", !!found);
  console.log("  Items:", found?.items.length);
  console.log("---");

  // 3. Cleanup
  console.log("Cleaning up (deleting test order)...");
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  console.log("Test order deleted.");
  console.log("---");
  console.log("ALL TESTS PASSED");
}

main()
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
