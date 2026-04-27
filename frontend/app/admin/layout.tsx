'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminNavId = "dashboard" | "categories" | "moderation" | "users";

function getActiveNav(pathname: string): AdminNavId {
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/moderation")) return "moderation";
  if (pathname.startsWith("/admin/users")) return "users";
  return "dashboard";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
          <p className="text-sm text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] bg-[#f5f6f8]">
      <AdminSidebar
        active={getActiveNav(pathname)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:ml-64 min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-[#e7f3eb] bg-white/90 backdrop-blur px-4 lg:px-6">
          <button
            type="button"
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span className="font-medium text-[#0d1b12]">Admin Panel</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
