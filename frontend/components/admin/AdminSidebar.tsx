'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type AdminNavId = "dashboard" | "categories" | "moderation" | "users";

const NAV_ITEMS: {
  id: AdminNavId;
  icon: string;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "categories", icon: "category", label: "Categories", href: "/admin/categories" },
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
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 flex-col border-r border-[#e7f3eb] bg-white shadow-xl transition-transform duration-300 flex ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0d1b12]">Admin</h1>
                <p className="text-[10px] font-medium text-[#4c9a66] uppercase tracking-widest">Mollmart</p>
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
                        ? "bg-red-50 text-red-700"
                        : "text-gray-600 hover:bg-gray-50"
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
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Back to Site</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-[#0d1b12]">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
