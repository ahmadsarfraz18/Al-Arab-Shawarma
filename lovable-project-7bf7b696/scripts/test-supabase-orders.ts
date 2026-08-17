/**
 * Test: Supabase client order CRUD against live production DB.
 * Run: npx tsx scripts/test-supabase-orders.ts
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = "https://kntkpdctcikcyduqmenx.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudGtwZGN0Y2lrY3lkdXFtZW54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA0MDc0NCwiZXhwIjoyMTAxNjE2NzQ0fQ.dycY-Dv62HmtUStULMsYSXvNPK1Zfo7IsQp68O8epiQ";

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log("Supabase URL:", url);

  // 1. CREATE order
  console.log("\n--- Creating test order ---");
  const orderId = randomUUID();
  const now = new Date().toISOString();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      created_at: now,
      updated_at: now,
      customer_name: "Supabase Test",
      customer_phone: "03001234567",
      customer_address: "Test Address, Lahore",
      customer_notes: null,
      area_label: null,
      delivery_charge: 100,
      subtotal: 500,
      total: 600,
      payment_method: "cod",
      transaction_ref: null,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  if (orderErr) {
    console.error("CREATE FAILED:", orderErr.message);
    process.exit(1);
  }
  console.log("Order created:", order.id, "#", order.order_number);

  // 2. CREATE items
  console.log("\n--- Creating order items ---");
  const { error: itemsErr } = await supabase.from("order_items").insert([
    {
      id: randomUUID(),
      order_id: order.id,
      name: "Shawarma Plate",
      quantity: 2,
      unit_price: 250,
      total: 500,
      size: "Regular",
    },
  ]);

  if (itemsErr) {
    console.error("ITEMS CREATE FAILED:", itemsErr.message);
    process.exit(1);
  }
  console.log("Items created successfully");

  // 3. READ order with items
  console.log("\n--- Reading order with items ---");
  const { data: full, error: readErr } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();

  if (readErr) {
    console.error("READ FAILED:", readErr.message);
    process.exit(1);
  }
  console.log("Order:", full.customer_name, "#", full.order_number);
  console.log("Items:", full.items?.length);
  full.items?.forEach((item: Record<string, unknown>) => {
    console.log(`  - ${item.name} x${item.quantity} @ Rs${item.unit_price}`);
  });

  // 4. LIST orders (basic)
  console.log("\n--- Listing orders (limit 3) ---");
  const { data: list, error: listErr } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(3);

  if (listErr) {
    console.error("LIST FAILED:", listErr.message);
    process.exit(1);
  }
  console.log("Listed", list?.length, "orders");
  list?.forEach((o: Record<string, unknown>) => {
    console.log(`  #${o.order_number} - ${o.customer_name} - Rs${o.total} [${o.status}]`);
  });

  // 5. COUNT orders
  console.log("\n--- Counting orders ---");
  const { count, error: countErr } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("COUNT FAILED:", countErr.message);
    process.exit(1);
  }
  console.log("Total orders:", count);

  // 6. UPDATE order status
  console.log("\n--- Updating order status ---");
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  if (updateErr) {
    console.error("UPDATE FAILED:", updateErr.message);
    process.exit(1);
  }
  console.log("Status updated to confirmed");

  // 7. CLEANUP
  console.log("\n--- Cleaning up test order ---");
  await supabase.from("order_items").delete().eq("order_id", order.id);
  await supabase.from("orders").delete().eq("id", order.id);
  console.log("Test order deleted");

  console.log("\n=== ALL TESTS PASSED ===");
}

main().catch((e) => {
  console.error("UNEXPECTED ERROR:", e);
  process.exit(1);
});
