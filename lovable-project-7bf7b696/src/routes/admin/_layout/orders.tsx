import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminError, AdminEmpty, TableSkeleton } from "@/components/admin/state-views";

import { formatCurrency, formatShortDate, formatRelativeTime } from "@/lib/format";
import {
  listOrders,
  updateOrderStatus,
  updatePaymentStatus,
  type OrderDto,
} from "@/lib/api/order.functions";

export const Route = createFileRoute("/admin/_layout/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOrdersPage,
});

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "preparing", label: "Preparing", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  easypaisa: "Easypaisa",
  bank: "Bank Transfer",
};

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cod: Banknote,
  easypaisa: Smartphone,
  bank: CreditCard,
};

function statusColor(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}

function paymentStatusColor(status: string): string {
  return (
    PAYMENT_STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800"
  );
}

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const pageSize = 15;

  const debouncedSearch = useDebounced(search, 300);

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", { search: debouncedSearch, status: statusFilter, page }],
    queryFn: () =>
      listOrders({ data: { search: debouncedSearch, status: statusFilter, page, pageSize } }),
  });

  const orders = ordersQuery.data?.orders ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      updateOrderStatus({ data: { id: vars.id, status: vars.status as "pending" | "confirmed" | "preparing" | "delivered" | "cancelled" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (vars: { id: string; paymentStatus: string }) =>
      updatePaymentStatus({
        data: { id: vars.id, paymentStatus: vars.paymentStatus as "pending" | "paid" | "failed" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
          <Package className="h-7 w-7 text-brand" /> Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      {ordersQuery.isError && (
        <AdminError
          message="Failed to load orders."
          onRetry={() => void ordersQuery.refetch()}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-card-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isLoading ? (
                  <TableSkeleton rows={5} />
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <AdminEmpty title="No orders found." hint="Orders will appear here once customers start ordering." />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const PayIcon = PAYMENT_ICONS[order.paymentMethod] ?? Banknote;
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono text-sm font-bold">#{order.orderNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.items.length} item(s)</span>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <PayIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${paymentStatusColor(order.paymentStatus)}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              updateStatusMutation.mutate({ id: order.id, status: v })
                            }
                          >
                            <SelectTrigger
                              className="h-8 w-[120px] text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatShortDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
        onPaymentChange={(id, paymentStatus) =>
          updatePaymentMutation.mutate({ id, paymentStatus })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Details Modal
// ---------------------------------------------------------------------------

function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  onPaymentChange,
}: {
  order: OrderDto | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onPaymentChange: (id: string, paymentStatus: string) => void;
}) {
  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Package className="h-5 w-5 text-brand" />
            Order #{order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Order Status</Label>
              <Select
                value={order.status}
                onValueChange={(v) => onStatusChange(order.id, v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Payment Status</Label>
              <Select
                value={order.paymentStatus}
                onValueChange={(v) => onPaymentChange(order.id, v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-brand" /> {order.customerName}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {order.customerPhone}
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.customerAddress}
            </div>
            {order.areaLabel && (
              <div className="text-xs text-muted-foreground">Area: {order.areaLabel}</div>
            )}
            {order.customerNotes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.customerNotes}
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Items</h4>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span>
                    {item.quantity}× {item.name}
                    {item.size ? ` (${item.size})` : ""}
                  </span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{formatCurrency(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            {order.transactionRef && <span>· Ref: {order.transactionRef}</span>}
          </div>

          <div className="text-xs text-muted-foreground">
            Placed {formatRelativeTime(order.createdAt)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// useDebounced hook
// ---------------------------------------------------------------------------

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
