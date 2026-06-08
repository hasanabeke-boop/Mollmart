'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export type BuyerNavId =
  | "my_requests"
  | "post_request"
  | "catalog"
  | "cart"
  | "orders"
  | "messages"
  | "assistant"
  | "admin";

export function getBuyerActiveNav(pathname: string): BuyerNavId {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/create-product-request")) return "post_request";
  if (pathname.startsWith("/profile")) return "my_requests";
  if (pathname.startsWith("/notifications")) return "my_requests";
  if (pathname.startsWith("/my-requests")) return "my_requests";
  if (pathname.startsWith("/products")) return "catalog";
  if (pathname.startsWith("/cart")) return "cart";
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname === "/chatbot" || pathname.startsWith("/chatbot/")) return "assistant";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "messages";
  return "my_requests";
}

const NAV_ITEMS: {
  id: BuyerNavId;
  icon: string;
  label: string;
  href: string;
}[] = [
  { id: "my_requests", icon: "playlist_add", label: "My requests", href: "/my-requests" },
  { id: "post_request", icon: "add_circle", label: "Post request", href: "/create-product-request" },
  { id: "catalog", icon: "storefront", label: "Catalog", href: "/products" },
  { id: "cart", icon: "shopping_cart", label: "Cart", href: "/cart" },
  { id: "orders", icon: "receipt_long", label: "Order history", href: "/orders" },
  { id: "messages", icon: "mail", label: "Messages", href: "/chat" },
  { id: "assistant", icon: "chat_bubble", label: "Assistant", href: "/chatbot" },
];

type Props = {
  active: BuyerNavId;
  open: boolean;
  onClose: () => void;
};

export default function BuyerSidebar({ active, open, onClose }: Props) {
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
                    isActive ? "bg-primary/10 text-[var(--foreground)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? "text-green-700" : ""}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  active === "admin"
                    ? "bg-red-50 text-red-800"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    active === "admin" ? "text-red-600" : ""
                  }`}
                >
                  admin_panel_settings
                </span>
                <span className={`text-sm ${active === "admin" ? "font-semibold" : "font-medium"}`}>
                  Admin
                </span>
              </Link>
            )}
          </nav>

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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">
                  {user?.name || user?.email || "Buyer"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">Buyer account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
