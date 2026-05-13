'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export type SellerNavId =
  | "dashboard"
  | "my_showcase"
  | "new_showcase"
  | "requests"
  | "offers"
  | "messages"
  | "analytics";

export function getSellerActiveNav(pathname: string): SellerNavId {
  if (pathname.startsWith("/seller/analytics")) return "analytics";
  if (pathname.startsWith("/seller/showcase")) return "my_showcase";
  if (pathname.startsWith("/seller/products/new")) return "new_showcase";
  if (pathname.startsWith("/seller/dashboard")) return "dashboard";
  if (pathname.startsWith("/seller")) return "dashboard";
  if (pathname.startsWith("/browse-buyer-requests")) return "requests";
  if (pathname.startsWith("/chat")) return "messages";
  return "dashboard";
}

const NAV_ITEMS: {
  id: SellerNavId;
  icon: string;
  label: string;
  href: string;
  badge?: number;
}[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/seller/dashboard" },
  { id: "my_showcase", icon: "grid_view", label: "My showcase", href: "/seller/showcase" },
  { id: "new_showcase", icon: "add_box", label: "New listing", href: "/seller/products/new" },
  { id: "requests", icon: "travel_explore", label: "Requests", href: "/browse-buyer-requests" },
  { id: "offers", icon: "local_offer", label: "Offers", href: "/browse-buyer-requests" },
  { id: "messages", icon: "mail", label: "Messages", href: "/chat" },
  { id: "analytics", icon: "analytics", label: "Analytics", href: "/seller/analytics" },
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
          className="fixed inset-0 top-16 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-[#e7f3eb] bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
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
                      ? "bg-primary/10 text-black"
                      : "text-gray-600 hover:bg-gray-50"
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
          </nav>
          {/* Bottom user card */}
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all"
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
                  {user?.name || user?.email || "Seller"}
                </p>
                <p className="truncate text-xs text-gray-500">Seller Account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

