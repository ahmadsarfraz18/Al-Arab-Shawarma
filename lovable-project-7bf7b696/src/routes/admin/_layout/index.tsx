import { useRouteContext, createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FolderOpen,
  History,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminError } from "@/components/admin/state-views";

import { getAdminOverview } from "@/lib/api/menu.functions";

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
};

const ENTITY_LABELS: Record<string, string> = {
  menu_item: "menu item",
  category: "category",
};

function activityLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  loading: boolean;
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
          <div className="font-display text-3xl font-bold">{value.toLocaleString("en-PK")}</div>
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
  });

  const stats = overview.data;
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <LayoutGrid className="h-5 w-5 text-brand" /> Quick Actions
            </CardTitle>
            <CardDescription>Common management tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
      </div>
    </div>
  );
}
