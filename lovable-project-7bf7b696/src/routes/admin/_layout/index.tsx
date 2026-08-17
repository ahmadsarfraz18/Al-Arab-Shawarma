import { useRouteContext, createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FolderOpen,
  History,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  ShoppingCart,
  Clock,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminError } from "@/components/admin/state-views";

import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";

import { getAdminOverview } from "@/lib/api/menu.functions";
import { getOrderStats, type OrderDto } from "@/lib/api/order.functions";

export const Route = createFileRoute("/admin/_layout/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Al-Arab Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  status_update: "Changed status of",
  request_password_reset: "Password reset link requested for",
  password_reset: "Password reset completed for",
};

const ENTITY_LABELS: Record<string, string> = {
  menu_item: "menu item",
  category: "category",
  delivery_zone: "delivery zone",
  delivery_area: "delivery area",
  contact_settings: "contact settings",
  payment_settings: "payment settings",
};

function activityLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

function formatWhen(iso: string): string {
  return formatRelativeTime(iso);
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  isCurrency,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  loading: boolean;
  isCurrency?: boolean;
}) {
  return (
    <Card className="shadow-card-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-brand" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="font-display text-3xl font-bold">
            {isCurrency ? formatCurrency(value) : formatNumber(value)}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { session } = useRouteContext({ from: "/admin/_layout" });
  const user = session?.user;
  const firstName = user?.name?.split(/\s+/)[0] ?? "Owner";

  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => getAdminOverview(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const orderStats = useQuery({
    queryKey: ["admin", "order-stats"],
    queryFn: () => getOrderStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const stats = overview.data;
  const orders = orderStats.data;
  const loading = overview.isLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
            <LayoutDashboard className="h-7 w-7 text-brand" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Welcome back, {firstName}. Here&apos;s the live state of your menu.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Owner access
        </div>
      </div>

      {overview.isError && (
        <AdminError
          message="Failed to load dashboard stats."
          onRetry={() => void overview.refetch()}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UtensilsCrossed}
          label="Menu Items"
          value={stats?.totalMenuItems ?? 0}
          hint="Total catalog items"
          loading={loading}
        />
        <StatCard
          icon={ListChecks}
          label="Active"
          value={stats?.activeMenuItems ?? 0}
          hint="Visible on public menu"
          loading={loading}
        />
        <StatCard
          icon={Sparkles}
          label="Hidden"
          value={stats?.hiddenMenuItems ?? 0}
          hint="Temporarily unavailable"
          loading={loading}
        />
        <StatCard
          icon={FolderOpen}
          label="Categories"
          value={stats?.activeCategories ?? 0}
          hint={`${stats?.totalCategories ?? 0} total, ${stats?.activeCategories ?? 0} active`}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={orders?.totalOrders ?? 0}
          hint="All time"
          loading={orderStats.isLoading}
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={orders?.pendingOrders ?? 0}
          hint="Awaiting confirmation"
          loading={orderStats.isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Sales"
          value={orders?.todaySales ?? 0}
          hint="Revenue today"
          loading={orderStats.isLoading}
          isCurrency
        />
        <StatCard
          icon={LayoutDashboard}
          label="Quick Stats"
          value={stats?.featuredItems ?? 0}
          hint="Featured menu items"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <LayoutGrid className="h-5 w-5 text-brand" /> Quick Actions
            </CardTitle>
            <CardDescription>Common management tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/orders" className="block">
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <ShoppingCart className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">View orders</div>
                    <div className="text-xs text-muted-foreground">
                      {orders?.pendingOrders ?? 0} pending order{(orders?.pendingOrders ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </Link>
            <Link to="/admin/menu" className="block">
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <UtensilsCrossed className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">Manage menu items</div>
                    <div className="text-xs text-muted-foreground">
                      Add, edit, hide or remove items
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </Link>
            <Link to="/admin/categories" className="block">
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <LayoutGrid className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">Manage categories</div>
                    <div className="text-xs text-muted-foreground">
                      Reorganize how the menu is grouped
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </Link>
            <Link to="/admin/homepage" className="block">
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <LayoutTemplate className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">Edit homepage</div>
                    <div className="text-xs text-muted-foreground">
                      Hero, about and why-us content
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </Link>
            <Link to="/admin/settings" className="block">
              <div className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <Settings className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">Site settings</div>
                    <div className="text-xs text-muted-foreground">
                      Edit contact info and payment details
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </Link>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold/15 text-gold">
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">Featured items</div>
                  <div className="text-xs text-muted-foreground">
                    {stats?.featuredItems ?? "—"} item{stats?.featuredItems === 1 ? "" : "s"} marked
                    as featured
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <History className="h-5 w-5 text-brand" /> Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/menu">
                View menu <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats && stats.recentActivity.length > 0 ? (
              <ul className="space-y-2">
                {stats.recentActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-semibold">{activityLabel(a.action)}</span>{" "}
                      <span className="text-muted-foreground">{entityLabel(a.entityType)}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatWhen(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No activity recorded yet. Changes you make will show up here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <ShoppingCart className="h-5 w-5 text-brand" /> Recent Orders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orderStats.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : orders && orders.recentOrders.length > 0 ? (
              <ul className="space-y-2">
                {orders.recentOrders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">#{o.orderNumber}</span>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {o.customerName} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold">{formatCurrency(o.total)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatRelativeTime(o.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet. Orders will appear here once customers start ordering.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
