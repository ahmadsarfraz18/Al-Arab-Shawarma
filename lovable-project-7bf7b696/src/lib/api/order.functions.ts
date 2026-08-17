import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";

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
// Public: Create Order (called from checkout)
// ---------------------------------------------------------------------------

export const createOrder = createServerFn({ method: "POST" })
  .validator(createOrderSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
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

    return toOrderDto(order);
  });

// ---------------------------------------------------------------------------
// Admin: List Orders (with search, filters, pagination)
// ---------------------------------------------------------------------------

export const listOrders = createServerFn({ method: "GET" })
  .validator(orderFiltersSchema)
  .handler(async ({ data }): Promise<{ orders: OrderDto[]; total: number }> => {
    await requireSession();

    const where: Record<string, unknown> = {};

    if (data.status && data.status !== "all") {
      where.status = data.status;
    }

    if (data.search) {
      const q = data.search;
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
        { orderNumber: Number.isFinite(Number(q)) ? Number(q) : undefined },
      ].filter((clause) => Object.values(clause).some((v) => v !== undefined));
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
  });

// ---------------------------------------------------------------------------
// Admin: Get Single Order
// ---------------------------------------------------------------------------

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<OrderDto | null> => {
    await requireSession();

    const order = await prisma.order.findUnique({
      where: { id: data.id },
      include: { items: true },
    });

    return order ? toOrderDto(order) : null;
  });

// ---------------------------------------------------------------------------
// Admin: Update Order Status
// ---------------------------------------------------------------------------

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(orderStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    await requireSession();

    const order = await prisma.order.update({
      where: { id: data.id },
      data: { status: data.status },
      include: { items: true },
    });

    return toOrderDto(order);
  });

// ---------------------------------------------------------------------------
// Admin: Update Payment Status
// ---------------------------------------------------------------------------

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .validator(paymentStatusSchema)
  .handler(async ({ data }): Promise<OrderDto> => {
    await requireSession();

    const order = await prisma.order.update({
      where: { id: data.id },
      data: { paymentStatus: data.paymentStatus },
      include: { items: true },
    });

    return toOrderDto(order);
  });

// ---------------------------------------------------------------------------
// Admin: Dashboard Stats
// ---------------------------------------------------------------------------

export const getOrderStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderStats> => {
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
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOrderDto(order: {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string | null;
  areaLabel: string | null;
  deliveryCharge: { toNumber: () => number };
  subtotal: { toNumber: () => number };
  total: { toNumber: () => number };
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string | null;
  status: string;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: { toNumber: () => number };
    total: { toNumber: () => number };
    size: string | null;
  }[];
}): OrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    customerNotes: order.customerNotes,
    areaLabel: order.areaLabel,
    deliveryCharge: order.deliveryCharge.toNumber(),
    subtotal: order.subtotal.toNumber(),
    total: order.total.toNumber(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    transactionRef: order.transactionRef,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      total: item.total.toNumber(),
      size: item.size,
    })),
  };
}
