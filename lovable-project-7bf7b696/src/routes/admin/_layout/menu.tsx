import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckSquare, Loader, Pencil, Plus, Search, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/admin/state-views";

import {
  createMenuItem,
  deleteMenuItem,
  listCategories,
  listMenuItems,
  setMenuItemStatus,
  updateMenuItem,
  type MenuItemDto,
} from "@/lib/api/menu.functions";
import {
  CONTENT_STATUSES,
  menuItemInputSchema,
  type ContentStatus,
  type MenuItemInput,
} from "@/lib/admin/schemas";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/admin/_layout/menu")({
  head: () => ({
    meta: [
      { title: "Menu Items — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MenuManagement,
});

function fmtPrice(n: number): string {
  return formatCurrency(n);
}

function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function MenuManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemDto | null>(null);

  const debouncedSearch = useDebounced(search);

  const itemsQuery = useQuery({
    queryKey: ["admin", "menu-items", debouncedSearch, categoryId, status],
    queryFn: () => listMenuItems({ data: { search: debouncedSearch, categoryId, status } }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const invalidateMenu = () => queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: ContentStatus }) =>
      setMenuItemStatus({ data: input }),
    onSuccess: () => {
      void invalidateMenu();
      toast.success("Menu item status updated");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem({ data: { id } }),
    onSuccess: () => {
      void invalidateMenu();
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Menu item deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveMutation = useMutation({
    mutationFn: (input: { id?: string; values: Parameters<typeof createMenuItem>[0]["data"] }) =>
      input.id
        ? updateMenuItem({ data: { ...input.values, id: input.id } })
        : createMenuItem({ data: input.values }),
    onSuccess: () => {
      void invalidateMenu();
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setFormOpen(false);
      toast.success("Menu item saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const categories = categoriesQuery.data ?? [];
  const items = itemsQuery.data ?? [];

  const filteredCount = items.length;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: MenuItemDto) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Items"
        description="Manage your full menu catalog — edit, hide or remove items."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Menu Item
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9"
            aria-label="Search menu items"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus | "all")}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CONTENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ACTIVE" ? "Active" : s === "HIDDEN" ? "Hidden" : "Archived"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {itemsQuery.isError && (
        <AdminError
          message="Failed to load menu items."
          onRetry={() => void itemsQuery.refetch()}
        />
      )}

      {itemsQuery.isLoading ? (
        <TableSkeleton rows={6} />
      ) : items.length === 0 ? (
        <AdminEmpty
          title={debouncedSearch ? "No matching items" : "No menu items yet"}
          hint={
            debouncedSearch
              ? "Try a different search term or clear the filters."
              : "Add your first menu item to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{item.name}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {item.featured && <Badge variant="secondary">Featured</Badge>}
                          {item.variants.length > 0 && (
                            <Badge variant="outline">{item.variants.length} sizes</Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{fmtPrice(item.basePrice)}</div>
                      {item.variants.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {item.variants.map((v) => `${v.label} ${fmtPrice(v.price)}`).join(" · ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.status === "ACTIVE"}
                        disabled={statusMutation.isPending}
                        onCheckedChange={(checked) =>
                          statusMutation.mutate({
                            id: item.id,
                            status: checked ? "ACTIVE" : "HIDDEN",
                          })
                        }
                        aria-label={`Toggle availability for ${item.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Delete menu item?"
                          description={
                            <>
                              <span className="font-semibold">{item.name}</span> will be permanently
                              removed from the menu, including its size variants. This cannot be
                              undone.
                            </>
                          }
                          confirmLabel="Delete"
                          onConfirm={() => {
                            deleteMutation.mutate(item.id);
                          }}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} item{filteredCount === 1 ? "" : "s"}
        {debouncedSearch || categoryId !== "all" || status !== "all" ? " (filtered)" : ""}. Hiding
        an item removes it from the public menu immediately.
      </p>

      {formOpen && (
        <MenuItemFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          item={editing}
          categories={categories}
          busy={saveMutation.isPending}
          onSubmit={saveMutation.mutate}
        />
      )}
    </div>
  );
}

type FormErrors = Record<string, string>;

type VariantRow = { label: string; price: string };

function MenuItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItemDto | null;
  categories: Array<{ id: string; name: string }>;
  busy: boolean;
  onSubmit: (input: { id?: string; values: MenuItemInput }) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [basePrice, setBasePrice] = useState(item ? String(item.basePrice) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "ACTIVE");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [displayOrder, setDisplayOrder] = useState(item ? String(item.displayOrder) : "0");
  const [variants, setVariants] = useState<VariantRow[]>(
    item?.variants.length
      ? item.variants.map((v) => ({ label: v.label, price: String(v.price) }))
      : [],
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const addVariant = () => setVariants((vs) => [...vs, { label: "", price: "" }]);

  const setVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((vs) => vs.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const removeVariant = (index: number) => setVariants((vs) => vs.filter((_, i) => i !== index));

  const handleSubmit = () => {
    const parsed = menuItemInputSchema.safeParse({
      name,
      categoryId,
      basePrice: basePrice === "" ? Number.NaN : Number(basePrice),
      description: description.trim() ? description.trim() : null,
      status,
      featured,
      displayOrder: displayOrder === "" ? 0 : Number(displayOrder),
      variants: variants
        .filter((v) => v.label.trim() !== "")
        .map((v) => ({
          label: v.label.trim(),
          price: v.price === "" ? Number.NaN : Number(v.price),
        })),
    });

    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(item ? { id: item.id, values: parsed.data } : { values: parsed.data });
  };

  const field = (key: string) => errors[key];

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          <DialogDescription>
            {item
              ? "Update the item details below. Changes appear on the public menu immediately."
              : "Create a new item. It will appear on the public menu once saved."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Signature 1998 Shawarma"
              maxLength={80}
            />
            {field("name") && <FieldError message={field("name")} />}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="item-category" aria-label="Select category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field("categoryId") && <FieldError message={field("categoryId")} />}
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No categories exist yet — create one from the Categories page first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="item-price">Base price (Rs.)</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="450"
              />
              {field("basePrice") && <FieldError message={field("basePrice")} />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-order">Display order</Label>
              <Input
                id="item-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              {field("displayOrder") && <FieldError message={field("displayOrder")} />}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short appetizing description…"
              maxLength={500}
              rows={3}
            />
            {field("description") && <FieldError message={field("description")} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="item-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger id="item-status" aria-label="Select status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "ACTIVE" ? "Active" : s === "HIDDEN" ? "Hidden" : "Archived"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <Checkbox
                id="featured-checkbox"
                checked={featured}
                onCheckedChange={(c) => setFeatured(c === true)}
              />
              <Label
                htmlFor="featured-checkbox"
                className="ml-2 flex cursor-pointer items-center gap-1.5 text-sm font-medium"
              >
                {featured ? (
                  <CheckSquare className="h-4 w-4 text-brand" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
                Featured
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Size variants (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus /> Add size
              </Button>
            </div>
            {variants.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add sizes to let customers pick (e.g. Small / Large). Leave empty for a single
                price.
              </p>
            )}
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={v.label}
                  onChange={(e) => setVariant(i, { label: e.target.value })}
                  placeholder="Size label (e.g. Small)"
                  className="flex-1"
                  maxLength={40}
                  aria-label={`Variant ${i + 1} label`}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={v.price}
                  onChange={(e) => setVariant(i, { price: e.target.value })}
                  placeholder="Price"
                  className="w-28"
                  aria-label={`Variant ${i + 1} price`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariant(i)}
                  className="text-destructive hover:text-destructive"
                  aria-label={`Remove variant ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {field("variants") && <FieldError message={field("variants")} />}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {item ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-destructive">{message}</p>;
}
