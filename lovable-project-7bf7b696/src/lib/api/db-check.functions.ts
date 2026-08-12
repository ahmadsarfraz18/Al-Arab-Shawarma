import { createServerFn } from "@tanstack/react-start";

export type DatabaseStats = {
  totalCategories: number;
  totalMenuItems: number;
  totalVariants: number;
  totalDeliveryZones: number;
  totalDeliveryAreas: number;
  totalUsers: number;
};

export type DatabaseHealthResponse = {
  ok: boolean;
  stats: DatabaseStats | null;
};

export const getDatabaseHealth = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("../server/prisma");

  const rows = await prisma.$queryRaw<
    Array<{
      total_categories: number;
      total_menu_items: number;
      total_variants: number;
      total_delivery_zones: number;
      total_delivery_areas: number;
      total_users: number;
    }>
  >`
    SELECT
      total_categories,
      total_menu_items,
      total_variants,
      total_delivery_zones,
      total_delivery_areas,
      total_users
    FROM admin_dashboard_stats
    LIMIT 1
  `;

  const row = rows[0] ?? null;

  return {
    ok: row !== null,
    stats: row
      ? {
          totalCategories: row.total_categories,
          totalMenuItems: row.total_menu_items,
          totalVariants: row.total_variants,
          totalDeliveryZones: row.total_delivery_zones,
          totalDeliveryAreas: row.total_delivery_areas,
          totalUsers: row.total_users,
        }
      : null,
  };
});
