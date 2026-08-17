import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";

// ---------------------------------------------------------------------------
// Auth helper — wraps getSession with try-catch so a missing session
// returns null instead of throwing.
// ---------------------------------------------------------------------------

async function requireSession() {
  try {
    const headers = await getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    if (!session) throw new Error("Authentication required");
    return session;
  } catch (err) {
    console.error("[orders] session check failed:", err);
    throw new Error("Authentication required");
  }
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
// Public: Create Order (called from checkout)
// ---------------------------------------------------------------------------

export const createOrder = createServerFn({ method: "POST" })
  .validator(createOrderSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    console.log("[orders] createOrder called", {
      customerName: data.customerName,
      paymentMethod: data.paymentMethod,
      itemCount: data.items.length,
      total: data.total,
    });

    try {
      const order = await prisma.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          customerNotes: data.customerNotes,
          areaLabel: data.areaLabel,
          deliveryCharge: data.deliveryCharge,
          subtotal: data.subtotal,
          total: data.total,
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef,
          items: {
            create: data.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              size: item.size,
            })),
          },
        },
        include: { items: true },
      });

      console.log("[orders] createOrder success:", order.id);
      return toOrderDto(order);
    } catch (err) {
      console.error("[orders] createOrder Prisma error:", err);
      throw new Error(
        `Failed to create order: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

// ---------------------------------------------------------------------------
// Admin: List Orders (with search, filters, pagination)
// ---------------------------------------------------------------------------

export const listOrders = createServerFn({ method: "POST" })
  .validator(orderFiltersSchema)
  .handler(async ({ data }): Promise<{ orders: OrderDto[]; total: number }> => {
    try {
      await requireSession();

      const where: Record<string, unknown> = {};

      if (data.status && data.status !== "all") {
        where.status = data.status;
      }

      if (data.search && data.search.trim() !== "") {
        const q = data.search.trim();
        const orFilters: Record<string, unknown>[] = [
          { customerName: { contains: q, mode: "insensitive" } },
          { customerPhone: { contains: q } },
        ];
        const num = Number(q);
        if (Number.isFinite(num)) {
          orFilters.push({ orderNumber: num });
        }
        where.OR = orFilters;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: true },
          orderBy: { createdAt: "desc" },
          skip: (data.page - 1) * data.pageSize,
          take: data.pageSize,
        }),
        prisma.order.count({ where }),
      ]);

      return { orders: orders.map(toOrderDto), total };
    } catch (err) {
      console.error("[orders] listOrders failed:", err);
      return { orders: [], total: 0 };
    }
  });

// ---------------------------------------------------------------------------
// Admin: Get Single Order
// ---------------------------------------------------------------------------

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<OrderDto | null> => {
    try {
      await requireSession();

      const order = await prisma.order.findUnique({
        where: { id: data.id },
        include: { items: true },
      });

      return order ? toOrderDto(order) : null;
    } catch (err) {
      console.error("[orders] getOrder failed:", err);
      return null;
    }
  });

// ---------------------------------------------------------------------------
// Admin: Update Order Status
// ---------------------------------------------------------------------------

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(orderStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    try {
      await requireSession();

      const order = await prisma.order.update({
        where: { id: data.id },
        data: { status: data.status },
        include: { items: true },
      });

      return toOrderDto(order);
    } catch (err) {
      console.error("[orders] updateOrderStatus failed:", err);
      throw new Error("Failed to update order status");
    }
  });

// ---------------------------------------------------------------------------
// Admin: Update Payment Status
// ---------------------------------------------------------------------------

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .validator(paymentStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    try {
      await requireSession();

      const order = await prisma.order.update({
        where: { id: data.id },
        data: { paymentStatus: data.paymentStatus },
        include: { items: true },
      });

      return toOrderDto(order);
    } catch (err) {
      console.error("[orders] updatePaymentStatus failed:", err);
      throw new Error("Failed to update payment status");
    }
  });

// ---------------------------------------------------------------------------
// Admin: Dashboard Stats
// ---------------------------------------------------------------------------

export const getOrderStats = createServerFn({ method: "POST" }).handler(
  async (): Promise<OrderStats> => {
    try {
      await requireSession();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [totalOrders, pendingOrders, todayAgg, recentOrders] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "pending" } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: todayStart } },
          _sum: { total: true },
        }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { items: true },
        }),
      ]);

      return {
        totalOrders,
        pendingOrders,
        todaySales: Number(todayAgg._sum.total ?? 0),
        recentOrders: recentOrders.map(toOrderDto),
      };
    } catch (err) {
      console.error("[orders] getOrderStats failed:", err);
      return { totalOrders: 0, pendingOrders: 0, todaySales: 0, recentOrders: [] };
    }
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(n: unknown): number {
  if (n == null) return 0;
  if (typeof n === "number") return n;
  if (typeof n === "string") return Number(n) || 0;
  if (typeof n === "object" && "toNumber" in (n as Record<string, unknown>)) {
    return (n as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function toOrderDto(order: Record<string, unknown>): OrderDto {
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    id: order.id as string,
    orderNumber: order.orderNumber as number,
    customerName: order.customerName as string,
    customerPhone: order.customerPhone as string,
    customerAddress: order.customerAddress as string,
    customerNotes: (order.customerNotes as string) ?? null,
    areaLabel: (order.areaLabel as string) ?? null,
    deliveryCharge: toDecimal(order.deliveryCharge),
    subtotal: toDecimal(order.subtotal),
    total: toDecimal(order.total),
    paymentMethod: order.paymentMethod as string,
    paymentStatus: order.paymentStatus as string,
    transactionRef: (order.transactionRef as string) ?? null,
    status: order.status as string,
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : String(order.createdAt ?? new Date().toISOString()),
    items: items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      quantity: item.quantity as number,
      unitPrice: toDecimal(item.unitPrice),
      total: toDecimal(item.total),
      size: (item.size as string) ?? null,
    })),
  };
}
