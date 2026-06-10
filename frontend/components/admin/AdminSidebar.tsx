'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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

const NAV_ITEMS: {
  id: AdminNavId;
  icon: string;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "categories", icon: "category", label: "Categories", href: "/admin/categories" },
  { id: "requests", icon: "description", label: "Buyer requests", href: "/admin/requests" },
  { id: "catalog", icon: "inventory_2", label: "Catalog", href: "/admin/catalog" },
  { id: "offers", icon: "local_offer", label: "Offers", href: "/admin/offers" },
  { id: "auctions", icon: "gavel", label: "Auctions", href: "/admin/auctions" },
  { id: "orders", icon: "receipt_long", label: "Orders", href: "/admin/orders" },
  { id: "monitoring", icon: "monitoring", label: "Monitoring", href: "/admin/monitoring" },
  { id: "moderation", icon: "gavel", label: "Moderation", href: "/admin/moderation" },
  { id: "users", icon: "group", label: "Users", href: "/admin/users" },
];

type Props = {
  active: AdminNavId;
  open: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ active, open, onClose }: Props) {
  const { user } = useAuth();

  return (
    <>
      {open && (
        <div
          className="app-sidebar-backdrop fixed inset-x-0 bottom-0 z-30 bg-black/40 md:hidden"
          style={{ top: "var(--app-header-height)" }}
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`app-sidebar app-sidebar-panel flex w-64 flex-col border-r shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col justify-between p-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Admin</h1>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Mollmart</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                      isActive
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        isActive ? "text-red-600" : ""
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-sm ${
                        isActive ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--text-muted)] transition-all hover:bg-[var(--surface-hover)]"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Back to Site</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
