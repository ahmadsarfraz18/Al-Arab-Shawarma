import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FolderOpen, Loader, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/admin/state-views";

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryDto,
} from "@/lib/api/menu.functions";
import {
  CONTENT_STATUSES,
  categoryInputSchema,
  type ContentStatus,
  type CategoryInput,
} from "@/lib/admin/schemas";

export const Route = createFileRoute("/admin/_layout/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CategoriesManagement,
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function CategoriesManagement() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
  };

  const saveMutation = useMutation({
    mutationFn: (input: { id?: string; values: CategoryInput }) =>
      input.id
        ? updateCategory({ data: { ...input.values, id: input.id } })
        : createCategory({ data: input.values }),
    onSuccess: () => {
      invalidateAll();
      setFormOpen(false);
      toast.success("Category saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Category deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your menu into categories shown on the public website."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add Category
          </Button>
        }
      />

      {categoriesQuery.isError && (
        <AdminError
          message="Failed to load categories."
          onRetry={() => void categoriesQuery.refetch()}
        />
      )}

      {categoriesQuery.isLoading ? (
        <TableSkeleton rows={5} />
      ) : categories.length === 0 ? (
        <AdminEmpty
          title="No categories yet"
          hint="Create your first category to start organizing menu items."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 font-semibold">
                          <FolderOpen className="h-4 w-4 shrink-0 text-brand" />
                          {c.name}
                        </span>
                        <span className="text-xs text-muted-foreground">/{c.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.itemCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.displayOrder}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(c);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {c.itemCount > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={() =>
                              toast.error(
                                `Category "${c.name}" still has ${c.itemCount} item(s). Move or delete them first.`,
                              )
                            }
                            aria-label={`Cannot delete ${c.name} — it has items`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <ConfirmDialog
                            title="Delete category?"
                            description={
                              <>
                                Category <span className="font-semibold">{c.name}</span> will be
                                permanently removed. This cannot be undone.
                              </>
                            }
                            confirmLabel="Delete"
                            onConfirm={() => deleteMutation.mutate(c.id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${c.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {formOpen && (
        <CategoryFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          category={editing}
          busy={saveMutation.isPending}
          onSubmit={saveMutation.mutate}
        />
      )}
    </div>
  );
}

type FormErrors = Record<string, string>;

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDto | null;
  busy: boolean;
  onSubmit: (input: { id?: string; values: CategoryInput }) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [displayOrder, setDisplayOrder] = useState(category ? String(category.displayOrder) : "0");
  const [status, setStatus] = useState<ContentStatus>(category?.status ?? "ACTIVE");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = () => {
    const parsed = categoryInputSchema.safeParse({
      name,
      status,
      displayOrder: displayOrder === "" ? 0 : Number(displayOrder),
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
    onSubmit(category ? { id: category.id, values: parsed.data } : { values: parsed.data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>Categories group menu items on the public website.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shawarma"
              maxLength={60}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category-order">Display order</Label>
              <Input
                id="category-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              {errors.displayOrder && (
                <p className="text-xs text-destructive">{errors.displayOrder}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger id="category-status" aria-label="Select status">
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
          </div>
          <p className="text-xs text-muted-foreground">
            Hiding a category removes it and its items from the public menu.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
