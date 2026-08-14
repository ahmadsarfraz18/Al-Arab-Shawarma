import { Link, Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  ExternalLink,
  Menu,
  Settings,
  Store,
  UtensilsCrossed,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { authClient } from "@/lib/auth/auth-client";
import { getSession } from "@/lib/auth/session";

export const Route = createFileRoute("/admin/_layout")({
  // Server-side session guard for every /admin/* route (SSR + client nav).
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    const isLogin = location.pathname === "/admin/login";

    if (isLogin && session) {
      throw redirect({ to: "/admin" });
    }
    if (!isLogin && !session) {
      throw redirect({ to: "/admin/login" });
    }

    return { session };
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

type NavItem = { label: string; icon: typeof LayoutDashboard; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Menu Items", icon: UtensilsCrossed, to: "/admin/menu" },
  { label: "Categories", icon: LayoutGrid, to: "/admin/categories" },
  { label: "Homepage", icon: LayoutTemplate, to: "/admin/homepage" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

function initialsOf(name: string | undefined): string {
  if (!name) return "AA";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AdminLayout() {
  const { session } = Route.useRouteContext();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // The login page renders standalone (no sidebar) inside this layout.
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const user = session?.user;

  const handleLogout = async () => {
    await authClient.signOut();
    // Full page navigation re-runs the server-side guard from a clean state.
    window.location.assign("/admin/login");
  };

  const nav = (item: NavItem) => (
    <Link
      key={item.label}
      to={item.to}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-brand/15 aria-[current=page]:text-brand"
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );

  const sidebarInner = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-brand-foreground">
          <Store className="h-4 w-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-sm font-bold">Al-Arab Shawarma</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            Admin Panel
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">{NAV_ITEMS.map(nav)}</nav>

      <div className="space-y-3 border-t border-border/60 p-4">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-brand text-brand-foreground font-semibold">
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut />
          Logout
        </Button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View public website
        </a>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-ink lg:flex">
          {sidebarInner}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2 font-display text-sm font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-brand-foreground">
                <Store className="h-4 w-4" />
              </span>
              Al-Arab Admin
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col bg-ink p-0">
                <SheetHeader className="px-5 pt-5 text-left">
                  <SheetTitle className="font-display text-sm">Admin menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col">{sidebarInner}</div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
