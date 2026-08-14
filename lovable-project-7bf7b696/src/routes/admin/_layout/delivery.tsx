import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader, MapPin, Pencil, Plus, Trash2, Truck } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  createDeliveryArea,
  createDeliveryZone,
  deleteDeliveryArea,
  deleteDeliveryZone,
  getAdminDeliveryZones,
  setDeliveryAreaStatus,
  setDeliveryZoneStatus,
  updateDeliveryArea,
  updateDeliveryZone,
  type AdminDeliveryZoneDto,
} from "@/lib/api/delivery.functions";
import {
  CONTENT_STATUSES,
  deliveryAreaInputSchema,
  deliveryZoneInputSchema,
  type ContentStatus,
  type DeliveryAreaInput,
  type DeliveryZoneInput,
} from "@/lib/admin/schemas";

export const Route = createFileRoute("/admin/_layout/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Zones — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DeliveryManagement,
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

const fmtRs = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

function DeliveryManagement() {
  const queryClient = useQueryClient();
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminDeliveryZoneDto | null>(null);
  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AdminDeliveryZoneDto["areas"][number] | null>(
    null,
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: ["admin", "delivery-zones"],
    queryFn: () => getAdminDeliveryZones(),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "delivery-zones"] });
    void queryClient.invalidateQueries({ queryKey: ["public-delivery-zones"] });
  };

  const zones = zonesQuery.data ?? [];
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0] ?? null;

  const saveZoneMutation = useMutation({
    mutationFn: (input: { id?: string; values: DeliveryZoneInput }) =>
      input.id
        ? updateDeliveryZone({ data: { ...input.values, id: input.id } })
        : createDeliveryZone({ data: input.values }),
    onSuccess: () => {
      invalidateAll();
      setZoneFormOpen(false);
      toast.success("Delivery zone saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => deleteDeliveryZone({ data: { id } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Delivery zone deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const setZoneStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: ContentStatus }) =>
      setDeliveryZoneStatus({ data: input }),
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveAreaMutation = useMutation({
    mutationFn: (input: { id?: string; values: DeliveryAreaInput }) =>
      input.id
        ? updateDeliveryArea({
            data: { ...input.values, id: input.id },
          })
        : createDeliveryArea({ data: input.values }),
    onSuccess: () => {
      invalidateAll();
      setAreaFormOpen(false);
      toast.success("Area saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => deleteDeliveryArea({ data: { id } }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Area deleted");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const setAreaStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: ContentStatus }) =>
      setDeliveryAreaStatus({ data: input }),
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Zones & Areas"
        description="Delivery fees and coverage areas shown on the public checkout. Changes apply immediately."
        actions={
          <Button
            onClick={() => {
              setEditingZone(null);
              setZoneFormOpen(true);
            }}
          >
            <Plus /> Add Zone
          </Button>
        }
      />

      {zonesQuery.isError && (
        <AdminError
          message="Failed to load delivery zones."
          onRetry={() => void zonesQuery.refetch()}
        />
      )}

      {zonesQuery.isLoading ? (
        <TableSkeleton rows={6} />
      ) : zones.length === 0 ? (
        <AdminEmpty
          title="No delivery zones yet"
          hint="Create a zone with its delivery fee, then add the areas it covers."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Zone</TableHead>
                  <TableHead>Delivery Fee</TableHead>
                  <TableHead>Areas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow
                    key={z.id}
                    className={selectedZone?.id === z.id ? "bg-brand/5" : undefined}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2 font-semibold">
                        <Truck className="h-4 w-4 shrink-0 text-brand" />
                        {z.name}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{fmtRs(z.deliveryCharge)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{z.areaCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={z.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{z.displayOrder}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Switch
                          checked={z.status === "ACTIVE"}
                          disabled={setZoneStatusMutation.isPending}
                          onCheckedChange={(v) =>
                            setZoneStatusMutation.mutate({
                              id: z.id,
                              status: v ? "ACTIVE" : "HIDDEN",
                            })
                          }
                          aria-label={`Toggle ${z.name} visibility`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedZoneId(z.id)}
                          aria-label={`Manage areas in ${z.name}`}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingZone(z);
                            setZoneFormOpen(true);
                          }}
                          aria-label={`Edit ${z.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Delete delivery zone?"
                          description={
                            <>
                              Zone <span className="font-semibold">{z.name}</span> will be
                              permanently removed. This cannot be undone.
                            </>
                          }
                          confirmLabel="Delete"
                          onConfirm={() => deleteZoneMutation.mutate(z.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${z.name}`}
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

      {selectedZone && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">
                Areas in {selectedZone.name}
                <span className="ml-2 rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold">
                  {selectedZone.areaCount}
                </span>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fmtRs(selectedZone.deliveryCharge)} delivery fee · shown on the public checkout.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingArea(null);
                setAreaFormOpen(true);
              }}
            >
              <Plus /> Add Area
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedZone.areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No areas in this zone yet. Add the first one above.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedZone.areas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {a.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={a.status === "ACTIVE"}
                            disabled={setAreaStatusMutation.isPending}
                            onCheckedChange={(v) =>
                              setAreaStatusMutation.mutate({
                                id: a.id,
                                status: v ? "ACTIVE" : "HIDDEN",
                              })
                            }
                            aria-label={`Toggle ${a.name} availability`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingArea(a);
                              setAreaFormOpen(true);
                            }}
                            aria-label={`Edit ${a.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            title="Delete area?"
                            description={
                              <>
                                Area <span className="font-semibold">{a.name}</span> will be
                                permanently removed from {selectedZone.name}. This cannot be undone.
                              </>
                            }
                            confirmLabel="Delete"
                            onConfirm={() => deleteAreaMutation.mutate(a.id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${a.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {zoneFormOpen && (
        <ZoneFormDialog
          key={editingZone?.id ?? "new-zone"}
          open={zoneFormOpen}
          onOpenChange={setZoneFormOpen}
          zone={editingZone}
          busy={saveZoneMutation.isPending}
          onSubmit={saveZoneMutation.mutate}
        />
      )}

      {areaFormOpen && selectedZone && (
        <AreaFormDialog
          key={editingArea?.id ?? "new-area"}
          open={areaFormOpen}
          onOpenChange={setAreaFormOpen}
          zoneId={selectedZone.id}
          area={editingArea}
          busy={saveAreaMutation.isPending}
          onSubmit={saveAreaMutation.mutate}
        />
      )}
    </div>
  );
}

type FormErrors = Record<string, string>;

function ZoneFormDialog({
  open,
  onOpenChange,
  zone,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: AdminDeliveryZoneDto | null;
  busy: boolean;
  onSubmit: (input: { id?: string; values: DeliveryZoneInput }) => void;
}) {
  const [name, setName] = useState(zone?.name ?? "");
  const [deliveryCharge, setDeliveryCharge] = useState(zone ? String(zone.deliveryCharge) : "0");
  const [status, setStatus] = useState<ContentStatus>(zone?.status ?? "ACTIVE");
  const [displayOrder, setDisplayOrder] = useState(zone ? String(zone.displayOrder) : "0");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = () => {
    const parsed = deliveryZoneInputSchema.safeParse({
      name,
      deliveryCharge: deliveryCharge === "" ? 0 : Number(deliveryCharge),
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
    onSubmit(zone ? { id: zone.id, values: parsed.data } : { values: parsed.data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{zone ? "Edit Delivery Zone" : "Add Delivery Zone"}</DialogTitle>
          <DialogDescription>
            Zones set the delivery fee; areas inside a zone share that fee on the checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input
              id="zone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zone A"
              maxLength={60}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zone-charge">Delivery fee (Rs)</Label>
              <Input
                id="zone-charge"
                type="number"
                min="0"
                step="1"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                placeholder="0"
              />
              {errors.deliveryCharge && (
                <p className="text-xs text-destructive">{errors.deliveryCharge}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zone-order">Display order</Label>
              <Input
                id="zone-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              {errors.displayOrder && (
                <p className="text-xs text-destructive">{errors.displayOrder}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zone-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger id="zone-status" aria-label="Select status">
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
          <p className="text-xs text-muted-foreground">
            Hiding a zone removes it and its areas from the public delivery section.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {zone ? "Save changes" : "Create zone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AreaFormDialog({
  open,
  onOpenChange,
  zoneId,
  area,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  area: AdminDeliveryZoneDto["areas"][number] | null;
  busy: boolean;
  onSubmit: (input: { id?: string; values: DeliveryAreaInput }) => void;
}) {
  const [name, setName] = useState(area?.name ?? "");
  const [status, setStatus] = useState<ContentStatus>(area?.status ?? "ACTIVE");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = () => {
    const parsed = deliveryAreaInputSchema.safeParse({
      zoneId,
      name,
      status,
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
    onSubmit(area ? { id: area.id, values: parsed.data } : { values: parsed.data });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? "Edit Area" : "Add Area"}</DialogTitle>
          <DialogDescription>
            Areas matching customer input on the checkout resolve to this zone&apos;s fee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="area-name">Area name</Label>
            <Input
              id="area-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clifton Block 1-6"
              maxLength={120}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            <p className="text-xs text-muted-foreground">
              Use grouped ranges (e.g. &quot;Clifton Block 1-6&quot;) so every block inside resolves
              automatically.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="area-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger id="area-status" aria-label="Select status">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {area ? "Save changes" : "Add area"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
