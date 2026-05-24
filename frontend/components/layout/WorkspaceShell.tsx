'use client';

import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import BuyerSidebar, { getBuyerActiveNav } from "@/components/buyer/BuyerSidebar";
import SellerSidebar, { getSellerActiveNav } from "@/components/seller/SellerSidebar";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

function isAuthOnlyPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth/")
  );
}

/** Marketing home — full-width layout even when logged in. */
function isLandingPath(pathname: string) {
  return pathname === "/";
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const workspace = useWorkspaceOptional();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);

  if (loading || !user || isAuthOnlyPath(pathname) || isLandingPath(pathname)) {
    return <>{children}</>;
  }

  /** Admin panel has its own sidebar layout. */
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const showSellerSidebar = activeRole === "seller" || user.role === "admin";
  const modeLabel = showSellerSidebar ? "Seller" : "Buyer";
  return (
    <div className="app-layout-with-sidebar relative w-full flex-1">
      {showSellerSidebar ? (
        <SellerSidebar
          active={getSellerActiveNav(pathname)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <BuyerSidebar
          active={getBuyerActiveNav(pathname)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="w-full">
        <div className="sticky top-[var(--app-header-height)] z-20 flex h-12 shrink-0 items-center gap-3 border-b border-[#e7f3eb] bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
            aria-label={`Open ${modeLabel.toLowerCase()} menu`}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-sm font-semibold text-[#0d1b12]">{modeLabel}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
