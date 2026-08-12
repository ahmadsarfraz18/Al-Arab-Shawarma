import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Prisma } from "@prisma/client";

import { auth } from "../auth/auth.server";
import { prisma } from "../server/prisma";
import {
  categoryIdSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  menuFiltersSchema,
  menuItemIdSchema,
  menuItemInputSchema,
  menuItemStatusSchema,
  menuItemUpdateSchema,
  type ContentStatus,
} from "../admin/schemas";

type VariantDto = {
  id: string;
  label: string;
  price: number;
  displayOrder: number;
};

export type MenuItemDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  status: ContentStatus;
  featured: boolean;
  displayOrder: number;
  categoryId: string;
  categoryName: string;
  variants: VariantDto[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  status: ContentStatus;
  displayOrder: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOverview = {
  totalMenuItems: number;
  activeMenuItems: number;
  hiddenMenuItems: number;
  archivedMenuItems: number;
  totalCategories: number;
  activeCategories: number;
  totalVariants: number;
  sizedItems: number;
  featuredItems: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
};

export type PublicMenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  featured: boolean;
  variants: Array<{ label: string; price: number }>;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  slug: string;
  items: PublicMenuItem[];
};

export type PublicMenu = {
  categories: PublicMenuCategory[];
};

const itemInclude = {
  category: { select: { id: true, name: true } },
  variants: { orderBy: { displayOrder: "asc" as const } },
} satisfies Prisma.MenuItemInclude;

type MenuItemWithRelations = Prisma.MenuItemGetPayload<{ include: typeof itemInclude }>;

function toMenuItemDto(item: MenuItemWithRelations): MenuItemDto {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    basePrice: Number(item.basePrice),
    status: item.status,
    featured: item.featured,
    displayOrder: item.displayOrder,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    variants: item.variants.map((v) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
      displayOrder: v.displayOrder,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function requireSession() {
  const headers = await getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Authentication required");
  return session;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

async function uniqueSlug(
  kind: "menuItem" | "category",
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await (kind === "category"
      ? prisma.category.findUnique({ where: { slug: candidate } })
      : prisma.menuItem.findUnique({ where: { slug: candidate } }));
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n++}`;
  }
}

async function logActivity(
  session: { user: { id: string } },
  action: string,
  entityType: string,
  entityId: string,
  details?: Prisma.InputJsonValue,
) {
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action,
      entityType,
      entityId,
      details: details ?? {},
    },
  });
}

export type MenuFilters = {
  search: string;
  categoryId: string;
  status: ContentStatus | "all";
};

export const getPublicMenu = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicMenu> => {
    const categories = await prisma.category.findMany({
      where: { status: "ACTIVE" },
      include: {
        menuItems: {
          where: { status: "ACTIVE" },
          include: { variants: { orderBy: { displayOrder: "asc" } } },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        items: c.menuItems.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          basePrice: Number(m.basePrice),
          featured: m.featured,
          variants: m.variants.map((v) => ({ label: v.label, price: Number(v.price) })),
        })),
      })),
    };
  },
);

export const getAdminOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminOverview> => {
    await requireSession();

    const [
      menuItemGroups,
      categoryGroups,
      totalVariants,
      sizedItems,
      featuredItems,
      recentActivity,
    ] = await Promise.all([
      prisma.menuItem.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.category.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.menuItemVariant.count(),
      prisma.menuItem.count({ where: { variants: { some: {} } } }),
      prisma.menuItem.count({ where: { featured: true } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const countByStatus = (
      rows: Array<{ status: ContentStatus; _count: { _all: number } }>,
      status: ContentStatus,
    ) => rows.find((r) => r.status === status)?._count._all ?? 0;

    return {
      totalMenuItems: menuItemGroups.reduce((a, g) => a + g._count._all, 0),
      activeMenuItems: countByStatus(menuItemGroups, "ACTIVE"),
      hiddenMenuItems: countByStatus(menuItemGroups, "HIDDEN"),
      archivedMenuItems: countByStatus(menuItemGroups, "ARCHIVED"),
      totalCategories: categoryGroups.reduce((a, g) => a + g._count._all, 0),
      activeCategories: countByStatus(categoryGroups, "ACTIVE"),
      totalVariants,
      sizedItems,
      featuredItems,
      recentActivity: recentActivity.map((r) => ({
        id: r.id.toString(),
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  },
);

export const listMenuItems = createServerFn({ method: "POST" })
  .validator(menuFiltersSchema)
  .handler(async ({ data }): Promise<MenuItemDto[]> => {
    await requireSession();

    const where: Prisma.MenuItemWhereInput = {};
    if (data.search) where.name = { contains: data.search, mode: "insensitive" };
    if (data.categoryId && data.categoryId !== "all") where.categoryId = data.categoryId;
    if (data.status && data.status !== "all") where.status = data.status;

    const items = await prisma.menuItem.findMany({
      where,
      include: itemInclude,
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }, { name: "asc" }],
    });

    return items.map(toMenuItemDto);
  });

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryDto[]> => {
    await requireSession();

    const rows = await prisma.category.findMany({
      include: { _count: { select: { menuItems: true } } },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      displayOrder: c.displayOrder,
      itemCount: c._count.menuItems,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  },
);

export const createMenuItem = createServerFn({ method: "POST" })
  .validator(menuItemInputSchema)
  .handler(async ({ data }): Promise<MenuItemDto> => {
    const session = await requireSession();
    const slug = await uniqueSlug("menuItem", data.name);

    const item = await prisma.menuItem.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        basePrice: data.basePrice,
        status: data.status,
        featured: data.featured,
        displayOrder: data.displayOrder,
        categoryId: data.categoryId,
        variants: data.variants.length
          ? {
              create: data.variants.map((v, i) => ({
                label: v.label,
                price: v.price,
                displayOrder: i,
              })),
            }
          : undefined,
      },
      include: itemInclude,
    });

    await logActivity(session, "create", "menu_item", item.id, { name: item.name });
    return toMenuItemDto(item);
  });

export const updateMenuItem = createServerFn({ method: "POST" })
  .validator(menuItemUpdateSchema)
  .handler(async ({ data }): Promise<MenuItemDto> => {
    const session = await requireSession();
    const existing = await prisma.menuItem.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Menu item not found");

    const slug = await uniqueSlug("menuItem", data.name, data.id);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.menuItemVariant.deleteMany({ where: { menuItemId: data.id } });
      return tx.menuItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug,
          description: data.description || null,
          basePrice: data.basePrice,
          status: data.status,
          featured: data.featured,
          displayOrder: data.displayOrder,
          categoryId: data.categoryId,
          variants: data.variants.length
            ? {
                create: data.variants.map((v, i) => ({
                  label: v.label,
                  price: v.price,
                  displayOrder: i,
                })),
              }
            : undefined,
        },
        include: itemInclude,
      });
    });

    await logActivity(session, "update", "menu_item", updated.id, { name: updated.name });
    return toMenuItemDto(updated);
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .validator(menuItemIdSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const session = await requireSession();
    const existing = await prisma.menuItem.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Menu item not found");

    await prisma.menuItem.delete({ where: { id: data.id } });
    await logActivity(session, "delete", "menu_item", data.id, { name: existing.name });
    return { ok: true };
  });

export const setMenuItemStatus = createServerFn({ method: "POST" })
  .validator(menuItemStatusSchema)
  .handler(async ({ data }): Promise<MenuItemDto> => {
    const session = await requireSession();
    const existing = await prisma.menuItem.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Menu item not found");

    const updated = await prisma.menuItem.update({
      where: { id: data.id },
      data: { status: data.status },
      include: itemInclude,
    });

    await logActivity(session, "status_update", "menu_item", updated.id, {
      status: data.status,
      name: updated.name,
    });
    return toMenuItemDto(updated);
  });

export const createCategory = createServerFn({ method: "POST" })
  .validator(categoryInputSchema)
  .handler(async ({ data }): Promise<CategoryDto> => {
    const session = await requireSession();
    const slug = await uniqueSlug("category", data.name);

    const created = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        status: data.status,
        displayOrder: data.displayOrder,
      },
      include: { _count: { select: { menuItems: true } } },
    });

    await logActivity(session, "create", "category", created.id, { name: created.name });
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      status: created.status,
      displayOrder: created.displayOrder,
      itemCount: created._count.menuItems,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  });

export const updateCategory = createServerFn({ method: "POST" })
  .validator(categoryUpdateSchema)
  .handler(async ({ data }): Promise<CategoryDto> => {
    const session = await requireSession();
    const existing = await prisma.category.findUnique({ where: { id: data.id } });
    if (!existing) throw new Error("Category not found");

    const slug = await uniqueSlug("category", data.name, data.id);
    const updated = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        status: data.status,
        displayOrder: data.displayOrder,
      },
      include: { _count: { select: { menuItems: true } } },
    });

    await logActivity(session, "update", "category", updated.id, { name: updated.name });
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      displayOrder: updated.displayOrder,
      itemCount: updated._count.menuItems,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator(categoryIdSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const session = await requireSession();
    const existing = await prisma.category.findUnique({
      where: { id: data.id },
      include: { _count: { select: { menuItems: true } } },
    });
    if (!existing) throw new Error("Category not found");

    if (existing._count.menuItems > 0) {
      throw new Error(
        `This category still has ${existing._count.menuItems} menu item(s). Move or delete them first.`,
      );
    }

    await prisma.category.delete({ where: { id: data.id } });
    await logActivity(session, "delete", "category", data.id, { name: existing.name });
    return { ok: true };
  });
