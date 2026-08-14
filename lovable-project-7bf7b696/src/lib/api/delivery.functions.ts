import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Prisma } from "@prisma/client";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";
import type { DeliveryArea } from "../delivery-areas";
import {
  deliveryAreaIdSchema,
  deliveryAreaInputSchema,
  deliveryAreaStatusSchema,
  deliveryAreaUpdateSchema,
  deliveryZoneIdSchema,
  deliveryZoneInputSchema,
  deliveryZoneStatusSchema,
  deliveryZoneUpdateSchema,
  type ContentStatus,
} from "../admin/schemas";

// ---------------------------------------------------------------------------
// Delivery zones & areas — the database is the single source of truth for the
// public checkout. Admin changes immediately refresh the public view (the
// module-level cache is invalidated by every admin mutator).
// ---------------------------------------------------------------------------

export type PublicDeliveryZone = {
  id: string;
  name: string;
  charge: number;
  areas: string[];
};

export type PublicDeliveryData = {
  zones: PublicDeliveryZone[];
  areas: DeliveryArea[];
};

const CACHE_TTL_MS = 60_000;

let cached: { expiresAt: number; value: PublicDeliveryData } | null = null;

async function loadPublicDeliveryData(): Promise<PublicDeliveryData> {
  const zones = await prisma.deliveryZone.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      areas: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      },
    },
  });

  const publicZones: PublicDeliveryZone[] = [];
  const areas: DeliveryArea[] = [];
  for (const zone of zones) {
    if (zone.areas.length === 0) continue;
    const charge = Number(zone.deliveryCharge);
    publicZones.push({
      id: zone.id,
      name: zone.name,
      charge,
      areas: zone.areas.map((a) => a.name),
    });
    for (const area of zone.areas) {
      areas.push({ area: area.name, zone: zone.name, charge });
    }
  }
  return { zones: publicZones, areas };
}

/** Public checkout data: active delivery zones with their active areas. */
export const getPublicDeliveryZones = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicDeliveryData> => {
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.value;

    const value = await loadPublicDeliveryData();
    cached = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  },
);

// ---------------------------------------------------------------------------
// Admin DTOs
// ---------------------------------------------------------------------------

export type AdminDeliveryAreaDto = {
  id: string;
  zoneId: string;
  name: string;
  status: ContentStatus;
  createdAt: string;
};

export type AdminDeliveryZoneDto = {
  id: string;
  name: string;
  deliveryCharge: number;
  status: ContentStatus;
  displayOrder: number;
  areaCount: number;
  areas: AdminDeliveryAreaDto[];
  createdAt: string;
  updatedAt: string;
};

function toAreaDto(area: {
  id: string;
  zoneId: string;
  name: string;
  status: ContentStatus;
  createdAt: Date;
}): AdminDeliveryAreaDto {
  return {
    id: area.id,
    zoneId: area.zoneId,
    name: area.name,
    status: area.status,
    createdAt: area.createdAt.toISOString(),
  };
}

function toZoneDto(zone: {
  id: string;
  name: string;
  deliveryCharge: Prisma.Decimal | number;
  status: ContentStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  areas: { id: string; zoneId: string; name: string; status: ContentStatus; createdAt: Date }[];
}): AdminDeliveryZoneDto {
  return {
    id: zone.id,
    name: zone.name,
    deliveryCharge: Number(zone.deliveryCharge),
    status: zone.status,
    displayOrder: zone.displayOrder,
    areaCount: zone.areas.length,
    areas: zone.areas.map(toAreaDto),
    createdAt: zone.createdAt.toISOString(),
    updatedAt: zone.updatedAt.toISOString(),
  };
}

async function requireSession() {
  const headers = await getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Authentication required");
  return session;
}

async function logActivity(
  session: { user: { id: string } },
  action: string,
  entityType: string,
  entityId: string,
  details: Prisma.InputJsonValue,
) {
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

// ---------------------------------------------------------------------------
// Admin — read
// ---------------------------------------------------------------------------

export const getAdminDeliveryZones = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminDeliveryZoneDto[]> => {
    await requireSession();

    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { areas: { orderBy: { name: "asc" } } },
    });
    return zones.map(toZoneDto);
  },
);

// ---------------------------------------------------------------------------
// Admin — zones CRUD
// ---------------------------------------------------------------------------

export const createDeliveryZone = createServerFn({ method: "POST" })
  .validator(deliveryZoneInputSchema)
  .handler(async ({ data }): Promise<AdminDeliveryZoneDto> => {
    const session = await requireSession();

    const existing = await prisma.deliveryZone.findUnique({ where: { name: data.name } });
    if (existing) throw new Error(`A zone named "${data.name}" already exists`);

    const created = await prisma.deliveryZone.create({
      data: {
        name: data.name,
        deliveryCharge: data.deliveryCharge,
        status: data.status,
        displayOrder: data.displayOrder,
      },
      include: { areas: true },
    });

    cached = null;
    await logActivity(session, "create", "delivery_zone", created.id, {
      name: created.name,
      deliveryCharge: Number(created.deliveryCharge),
    });

    return toZoneDto(created);
  });

export const updateDeliveryZone = createServerFn({ method: "POST" })
  .validator(deliveryZoneUpdateSchema)
  .handler(async ({ data }): Promise<AdminDeliveryZoneDto> => {
    const session = await requireSession();

    const existing = await prisma.deliveryZone.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Delivery zone not found");

    const duplicate = await prisma.deliveryZone.findUnique({ where: { name: data.name } });
    if (duplicate && duplicate.id !== data.id) {
      throw new Error(`A zone named "${data.name}" already exists`);
    }

    const updated = await prisma.deliveryZone.update({
      where: { id: data.id },
      data: {
        name: data.name,
        deliveryCharge: data.deliveryCharge,
        status: data.status,
        displayOrder: data.displayOrder,
      },
      include: { areas: { orderBy: { name: "asc" } } },
    });

    cached = null;
    await logActivity(session, "update", "delivery_zone", updated.id, {
      changed: ["name", "deliveryCharge", "status", "displayOrder"],
      name: updated.name,
    });

    return toZoneDto(updated);
  });

export const setDeliveryZoneStatus = createServerFn({ method: "POST" })
  .validator(deliveryZoneStatusSchema)
  .handler(async ({ data }): Promise<AdminDeliveryZoneDto> => {
    const session = await requireSession();

    const existing = await prisma.deliveryZone.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Delivery zone not found");

    const updated = await prisma.deliveryZone.update({
      where: { id: data.id },
      data: { status: data.status },
      include: { areas: { orderBy: { name: "asc" } } },
    });

    cached = null;
    await logActivity(session, "status_update", "delivery_zone", updated.id, {
      status: updated.status,
      name: updated.name,
    });

    return toZoneDto(updated);
  });

export const deleteDeliveryZone = createServerFn({ method: "POST" })
  .validator(deliveryZoneIdSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const session = await requireSession();

    const existing = await prisma.deliveryZone.findUnique({
      where: { id: data.id },
      include: { areas: { select: { id: true } } },
    });
    if (!existing) throw new Error("Delivery zone not found");
    if (existing.areas.length > 0) {
      throw new Error(
        `Zone "${existing.name}" still has ${existing.areas.length} area(s). Remove them first.`,
      );
    }

    await prisma.deliveryZone.delete({ where: { id: data.id } });

    cached = null;
    await logActivity(session, "delete", "delivery_zone", data.id, { name: existing.name });

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Admin — areas CRUD
// ---------------------------------------------------------------------------

export const createDeliveryArea = createServerFn({ method: "POST" })
  .validator(deliveryAreaInputSchema)
  .handler(async ({ data }): Promise<AdminDeliveryAreaDto> => {
    const session = await requireSession();

    const zone = await prisma.deliveryZone.findUnique({ where: { id: data.zoneId } });
    if (!zone) throw new Error("Delivery zone not found");

    const existing = await prisma.deliveryArea.findUnique({
      where: { zoneId_name: { zoneId: data.zoneId, name: data.name } },
    });
    if (existing) throw new Error(`Area "${data.name}" already exists in ${zone.name}`);

    const created = await prisma.deliveryArea.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        status: data.status,
      },
    });

    cached = null;
    await logActivity(session, "create", "delivery_area", created.id, {
      name: created.name,
      zone: zone.name,
    });

    return toAreaDto(created);
  });

export const updateDeliveryArea = createServerFn({ method: "POST" })
  .validator(deliveryAreaUpdateSchema)
  .handler(async ({ data }): Promise<AdminDeliveryAreaDto> => {
    const session = await requireSession();

    const existing = await prisma.deliveryArea.findUnique({
      where: { id: data.id },
      include: { zone: true },
    });
    if (!existing) throw new Error("Delivery area not found");

    const duplicate = await prisma.deliveryArea.findUnique({
      where: { zoneId_name: { zoneId: data.zoneId, name: data.name } },
    });
    if (duplicate && duplicate.id !== data.id) {
      throw new Error(`Area "${data.name}" already exists in ${existing.zone.name}`);
    }

    const updated = await prisma.deliveryArea.update({
      where: { id: data.id },
      data: { zoneId: data.zoneId, name: data.name, status: data.status },
    });

    cached = null;
    await logActivity(session, "update", "delivery_area", updated.id, {
      changed: ["name", "status"],
      name: updated.name,
    });

    return toAreaDto(updated);
  });

export const setDeliveryAreaStatus = createServerFn({ method: "POST" })
  .validator(deliveryAreaStatusSchema)
  .handler(async ({ data }): Promise<AdminDeliveryAreaDto> => {
    const session = await requireSession();

    const existing = await prisma.deliveryArea.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Delivery area not found");

    const updated = await prisma.deliveryArea.update({
      where: { id: data.id },
      data: { status: data.status },
    });

    cached = null;
    await logActivity(session, "status_update", "delivery_area", updated.id, {
      status: updated.status,
      name: updated.name,
    });

    return toAreaDto(updated);
  });

export const deleteDeliveryArea = createServerFn({ method: "POST" })
  .validator(deliveryAreaIdSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const session = await requireSession();

    const existing = await prisma.deliveryArea.findUnique({
      where: { id: data.id },
      include: { zone: true },
    });
    if (!existing) throw new Error("Delivery area not found");

    await prisma.deliveryArea.delete({ where: { id: data.id } });

    cached = null;
    await logActivity(session, "delete", "delivery_area", data.id, {
      name: existing.name,
      zone: existing.zone.name,
    });

    return { ok: true };
  });
