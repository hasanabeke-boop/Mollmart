'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export type BuyerNavId =
  | "my_requests"
  | "post_request"
  | "showcase"
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
  if (pathname.startsWith("/products")) return "showcase";
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
  { id: "showcase", icon: "storefront", label: "Showcase", href: "/products" },
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
          className="app-sidebar-backdrop fixed inset-x-0 bottom-0 z-30 bg-black/30 lg:hidden"
          style={{ top: "var(--app-header-height)" }}
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`app-sidebar flex w-64 flex-col border-r border-[#e7f3eb] bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col justify-between p-4">
          <nav className="flex flex-col gap-2 pt-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isActive ? "bg-primary/10 text-black" : "text-gray-600 hover:bg-gray-50"
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
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-50"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[#0d1b12]">
                  {user?.name || user?.email || "Buyer"}
                </p>
                <p className="truncate text-xs text-gray-500">Buyer account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
