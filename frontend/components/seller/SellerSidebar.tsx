'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";

export type SellerNavId =
  | "dashboard"
  | "my_listings"
  | "new_listing"
  | "requests"
  | "auctions"
  | "offers"
  | "messages"
  | "assistant"
  | "orders"
  | "admin";

export function getSellerActiveNav(pathname: string): SellerNavId {
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/seller/auctions")) return "auctions";
  if (pathname.startsWith("/seller/analytics") || pathname.startsWith("/seller/dashboard")) return "dashboard";
  if (pathname.startsWith("/seller/listings") || pathname.startsWith("/seller/showcase")) return "my_listings";
  if (pathname.startsWith("/seller/products/new")) return "new_listing";
  if (pathname.startsWith("/seller")) return "dashboard";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/browse-buyer-requests")) return "requests";
  if (pathname.startsWith("/profile")) return "dashboard";
  if (pathname.startsWith("/notifications")) return "dashboard";
  if (pathname === "/chatbot" || pathname.startsWith("/chatbot/")) return "assistant";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "messages";
  return "dashboard";
}

const NAV_ITEMS: {
  id: SellerNavId;
  icon: string;
  label: string;
  href: string;
  badge?: number;
}[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/seller/analytics" },
  { id: "my_listings", icon: "grid_view", label: "My listings", href: "/seller/listings" },
  { id: "new_listing", icon: "add_box", label: "New product", href: "/seller/products/new" },
  { id: "requests", icon: "travel_explore", label: "Requests", href: "/browse-buyer-requests" },
  { id: "auctions", icon: "gavel", label: "Active auctions", href: "/seller/auctions" },
  { id: "orders", icon: "receipt_long", label: "Order history", href: "/orders" },
  { id: "messages", icon: "mail", label: "Messages", href: "/chat" },
  { id: "assistant", icon: "chat_bubble", label: "Assistant", href: "/chatbot" },
];

type Props = {
  active: SellerNavId;
  open: boolean;
  onClose: () => void;
};

export default function SellerSidebar({ active, open, onClose }: Props) {
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
          <div className="mb-2 flex items-center justify-between md:hidden">
            <span className="text-sm font-semibold text-[var(--foreground)]">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
          <nav className="flex flex-col gap-2 pt-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isActive
                      ? "bg-primary/10 text-[var(--foreground)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      isActive ? "text-green-700" : ""
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
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  active === "admin"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    active === "admin" ? "text-red-600" : ""
                  }`}
                >
                  admin_panel_settings
                </span>
                <span
                  className={`text-sm ${
                    active === "admin" ? "font-semibold" : "font-medium"
                  }`}
                >
                  Admin
                </span>
              </Link>
            )}
          </nav>
          {/* Bottom user card */}
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--text-muted)] transition-all hover:bg-[var(--surface-hover)]"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <UserAvatar
                name={user?.name}
                email={user?.email}
                avatarUrl={user?.avatarUrl}
                size="sm"
              />
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">
                  {user?.name || user?.email || "Seller"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">Seller account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

