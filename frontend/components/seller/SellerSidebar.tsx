'use client';

import Link from "next/link";
import { useState } from "react";

type SellerNavId = "dashboard" | "products" | "orders" | "messages" | "analytics";

const NAV_ITEMS: {
  id: SellerNavId;
  icon: string;
  label: string;
  href: string;
  badge?: number;
}[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/seller/dashboard" },
  { id: "products", icon: "inventory_2", label: "Products", href: "/products" },
  { id: "orders", icon: "shopping_bag", label: "Orders", href: "/orders", badge: 3 },
  { id: "messages", icon: "mail", label: "Messages", href: "/chat" },
  { id: "analytics", icon: "analytics", label: "Analytics", href: "/seller/analytics" },
];

type Props = {
  active: SellerNavId;
};

export default function SellerSidebar({ active }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Невидимая область у левого края для открытия */}
      <div
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-2 z-30 lg:block hidden"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Сам сайдбар с анимацией выезда */}
      <aside
        className={`fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-[#e7f3eb] bg-white shadow-xl transition-transform duration-300 lg:flex ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">
                <span className="material-symbols-outlined text-2xl">storefront</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0d1b12]">Mollmart</h1>
            </div>
            {/* Nav */}
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
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
          </div>
          {/* Bottom user card */}
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div
                className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 bg-center bg-cover"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBwpsKPou9QRuZh6en26Wt8HPM_95MuH3oTKjCjJYtWM8eeYpVNMk-ijQrBBfqWfnwxxcLrd0mYSNWNHwsAr0X8hcrPU4W5MY55btA-2Ct_6CWsOczzf1xb8qUfxcq0jUCl9d9vQHUlPe3T40b_DZ5TvOuLmx5E4rJ-R8fBk1n_TY-2TYtPhwukYQIHNT6YgVOgOmPzJrcSX56U93uxuOELjiQdX7uEV7VBctbFqHvNHGYpm4gFXHKasBtoXQHdQS0n17pumj0PhDY")',
                }}
              />
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[#0d1b12]">
                  Alex Morgan
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

