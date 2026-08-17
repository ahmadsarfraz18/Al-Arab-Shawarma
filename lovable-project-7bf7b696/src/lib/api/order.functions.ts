import { randomUUID } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { auth } from "../auth/auth.server";
import { getSupabaseClient } from "../server/supabase";

// ---------------------------------------------------------------------------
// Auth helper — identical pattern to menu.functions.ts (no try-catch wrapper)
// ---------------------------------------------------------------------------

async function requireSession() {
  const headers = await getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Authentication required");
  return session;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderItemDto = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  size: string | null;
};

export type OrderDto = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string | null;
  areaLabel: string | null;
  deliveryCharge: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string | null;
  status: string;
  createdAt: string;
  items: OrderItemDto[];
};

export type OrderStats = {
  totalOrders: number;
  pendingOrders: number;
  todaySales: number;
  recentOrders: OrderDto[];
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(1).max(20),
  customerAddress: z.string().min(1).max(300),
  customerNotes: z.string().max(300).optional(),
  areaLabel: z.string().optional(),
  deliveryCharge: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  paymentMethod: z.enum(["cod", "easypaisa", "bank"]),
  transactionRef: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      total: z.number().min(0),
      size: z.string().optional(),
    }),
  ),
});

const orderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "preparing", "delivered", "cancelled"]),
});

const paymentStatusSchema = z.object({
  id: z.string().uuid(),
  paymentStatus: z.enum(["pending", "paid", "failed"]),
});

const orderFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Helpers — Supabase returns snake_case columns; map to camelCase DTO
// ---------------------------------------------------------------------------

function safeNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function num(v: unknown): number {
  return safeNum(v, 0);
}

function toOrderDto(row: Record<string, unknown>, items: unknown): OrderDto {
  const orderItems = Array.isArray(items) ? items : [];
  return {
    id: String(row.id),
    orderNumber: Number(row.order_number),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerAddress: String(row.customer_address),
    customerNotes: (row.customer_notes as string) ?? null,
    areaLabel: (row.area_label as string) ?? null,
    deliveryCharge: num(row.delivery_charge),
    subtotal: num(row.subtotal),
    total: num(row.total),
    paymentMethod: String(row.payment_method),
    paymentStatus: String(row.payment_status),
    transactionRef: (row.transaction_ref as string) ?? null,
    status: String(row.status),
    createdAt: row.created_at
      ? new Date(String(row.created_at)).toISOString()
      : new Date().toISOString(),
    items: orderItems.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      name: String(item.name),
      quantity: Number(item.quantity),
      unitPrice: num(item.unit_price),
      total: num(item.total),
      size: (item.size as string) ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Public: Create Order (called from checkout)
// ---------------------------------------------------------------------------

export const createOrder = createServerFn({ method: "POST" })
  .validator(createOrderSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    console.log("[orders] createOrder called with:", JSON.stringify({
      name: data.customerName,
      phone: data.customerPhone,
      method: data.paymentMethod,
      total: data.total,
      items: data.items.length,
    }));

    // 1. Insert order row
    const orderId = randomUUID();
    const now = new Date().toISOString();

    const { data: orderRow, error: orderErr } = await getSupabaseClient()
      .from("orders")
      .insert({
        id: orderId,
        created_at: now,
        updated_at: now,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_address: data.customerAddress,
        customer_notes: data.customerNotes ?? null,
        area_label: data.areaLabel ?? null,
        delivery_charge: data.deliveryCharge,
        subtotal: data.subtotal,
        total: data.total,
        payment_method: data.paymentMethod,
        transaction_ref: data.transactionRef ?? null,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderErr) {
      console.error("[orders] insert order failed:", orderErr.message);
      throw new Error(`Order insert failed: ${orderErr.message}`);
    }

    // 2. Insert order items
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map((item) => ({
        id: randomUUID(),
        order_id: orderRow.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        size: item.size ?? null,
      }));

      const { error: itemsErr } = await getSupabaseClient()
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsErr) {
        console.error("[orders] insert items failed:", itemsErr.message);
        throw new Error(`Order items insert failed: ${itemsErr.message}`);
      }
    }

    // 3. Fetch the complete order with items
    const { data: fullOrder, error: fetchErr } = await getSupabaseClient()
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", orderRow.id)
      .single();

    if (fetchErr) {
      console.error("[orders] fetch order failed:", fetchErr.message);
      throw new Error(`Order fetch failed: ${fetchErr.message}`);
    }

    console.log("[orders] createOrder SUCCESS:", fullOrder.id, "#", fullOrder.order_number);
    return toOrderDto(fullOrder, (fullOrder as Record<string, unknown>).items);
  });

// ---------------------------------------------------------------------------
// Admin: List Orders — errors propagate to client (no silent catch)
// ---------------------------------------------------------------------------

export const listOrders = createServerFn({ method: "POST" })
  .validator(orderFiltersSchema)
  .handler(async ({ data }): Promise<{ orders: OrderDto[]; total: number }> => {
    await requireSession();

    let query = getSupabaseClient()
      .from("orders")
      .select("*, items:order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false });

    // Status filter
    if (data.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }

    // Search filter — name (ilike), phone (eq), order_number (eq)
    if (data.search && data.search.trim() !== "") {
      const q = data.search.trim();
      const numVal = Number(q);
      if (Number.isFinite(numVal)) {
        // Search by order number OR name OR phone
        query = query.or(
          `order_number.eq.${numVal},customer_name.ilike.%${q}%,customer_phone.eq.${q}`,
        );
      } else {
        // Text search — name or phone
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.eq.${q}`,
        );
      }
    }

    // Pagination
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("[orders] listOrders query failed:", error.message);
      throw new Error(`List orders failed: ${error.message}`);
    }

    console.log("[orders] listOrders returned:", (orders ?? []).length, "of", count ?? 0, "total");
    return {
      orders: (orders ?? []).map((row) => toOrderDto(row, (row as Record<string, unknown>).items)),
      total: count ?? 0,
    };
  });

// ---------------------------------------------------------------------------
// Admin: Get Single Order
// ---------------------------------------------------------------------------

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<OrderDto | null> => {
    await requireSession();

    const { data: order, error } = await getSupabaseClient()
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", data.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(`Get order failed: ${error.message}`);
    }

    return toOrderDto(order, (order as Record<string, unknown>).items);
  });

// ---------------------------------------------------------------------------
// Admin: Update Order Status
// ---------------------------------------------------------------------------

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(orderStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    await requireSession();

    const { data: order, error } = await getSupabaseClient()
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*, items:order_items(*)")
      .single();

    if (error) throw new Error(`Update order status failed: ${error.message}`);

    return toOrderDto(order, (order as Record<string, unknown>).items);
  });

// ---------------------------------------------------------------------------
// Admin: Update Payment Status
// ---------------------------------------------------------------------------

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .validator(paymentStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    await requireSession();

    const { data: order, error } = await getSupabaseClient()
      .from("orders")
      .update({ payment_status: data.paymentStatus })
      .eq("id", data.id)
      .select("*, items:order_items(*)")
      .single();

    if (error) throw new Error(`Update payment status failed: ${error.message}`);

    return toOrderDto(order, (order as Record<string, unknown>).items);
  });

// ---------------------------------------------------------------------------
// Admin: Dashboard Stats — errors propagate to client (no silent catch)
// ---------------------------------------------------------------------------

export const getOrderStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderStats> => {
    await requireSession();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Run all queries in parallel
    const [totalResult, pendingResult, todayResult, recentResult] = await Promise.all([
      // Total orders count
      getSupabaseClient().from("orders").select("*", { count: "exact", head: true }),

      // Pending orders count
      getSupabaseClient()
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),

      // Today's sales sum
      getSupabaseClient()
        .from("orders")
        .select("total")
        .gte("created_at", todayStart.toISOString()),

      // Recent 5 orders
      getSupabaseClient()
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (totalResult.error) throw new Error(`Stats (total) failed: ${totalResult.error.message}`);
    if (pendingResult.error) throw new Error(`Stats (pending) failed: ${pendingResult.error.message}`);
    if (todayResult.error) throw new Error(`Stats (today) failed: ${todayResult.error.message}`);
    if (recentResult.error) throw new Error(`Stats (recent) failed: ${recentResult.error.message}`);

    const todaySales = (todayResult.data ?? []).reduce(
      (sum, row) => sum + num(row.total),
      0,
    );

    console.log("[orders] getOrderStats:", {
      total: totalResult.count,
      pending: pendingResult.count,
    });

    return {
      totalOrders: totalResult.count ?? 0,
      pendingOrders: pendingResult.count ?? 0,
      todaySales,
      recentOrders: (recentResult.data ?? []).map((row) =>
        toOrderDto(row, (row as Record<string, unknown>).items),
      ),
    };
  },
);
