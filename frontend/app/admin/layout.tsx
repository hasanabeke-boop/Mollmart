'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminNavId =
  | "dashboard"
  | "categories"
  | "requests"
  | "catalog"
  | "offers"
  | "auctions"
  | "moderation"
  | "users"
  | "orders"
  | "monitoring";

function getActiveNav(pathname: string): AdminNavId {
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/requests")) return "requests";
  if (pathname.startsWith("/admin/catalog")) return "catalog";
  if (pathname.startsWith("/admin/offers")) return "offers";
  if (pathname.startsWith("/admin/auctions")) return "auctions";
  if (pathname.startsWith("/admin/moderation")) return "moderation";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/monitoring")) return "monitoring";
  return "dashboard";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }

    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="app-page-min-height flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-red-600" />
          <p className="text-sm text-[var(--text-muted)]">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="app-page-min-height relative bg-[var(--background)] md:pl-64">
      <AdminSidebar
        active={getActiveNav(pathname)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-[var(--app-header-height)] z-30 flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-3 backdrop-blur md:hidden sm:px-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <span className="truncate text-sm font-semibold text-[var(--foreground)]">Admin</span>
        </header>

        <main className="app-page app-page-wide min-w-0">{children}</main>
      </div>
    </div>
  );
}
