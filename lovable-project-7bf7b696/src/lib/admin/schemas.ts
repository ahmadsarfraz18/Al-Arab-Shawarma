import { z } from "zod";

export const CONTENT_STATUSES = ["ACTIVE", "HIDDEN", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const statusSchema = z.enum(CONTENT_STATUSES);

const priceSchema = z
  .number({ message: "Price must be a number" })
  .finite()
  .min(0, "Price must be 0 or more")
  .max(100000, "Price is too large");

export const menuItemVariantSchema = z.object({
  label: z.string().trim().min(1, "Variant label is required").max(40),
  price: priceSchema,
});

export const menuItemInputSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .nullable(),
  basePrice: priceSchema,
  status: statusSchema,
  featured: z.boolean(),
  displayOrder: z.number().int().min(-10000).max(10000),
  variants: z.array(menuItemVariantSchema).max(12, "Too many variants"),
});

export const menuItemUpdateSchema = menuItemInputSchema.extend({
  id: z.string().min(1, "Item id is required"),
});

export const menuItemStatusSchema = z.object({
  id: z.string().min(1, "Item id is required"),
  status: statusSchema,
});

export const menuItemIdSchema = z.object({
  id: z.string().min(1, "Item id is required"),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name must be 60 characters or fewer"),
  status: statusSchema,
  displayOrder: z.number().int().min(-10000).max(10000),
});

export const categoryUpdateSchema = categoryInputSchema.extend({
  id: z.string().min(1, "Category id is required"),
});

export const categoryIdSchema = z.object({
  id: z.string().min(1, "Category id is required"),
});

export const menuFiltersSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  categoryId: z.string().optional().default("all"),
  status: z
    .union([statusSchema, z.literal("all")])
    .optional()
    .default("all"),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
