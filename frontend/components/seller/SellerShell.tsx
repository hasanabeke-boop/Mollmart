'use client';

import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SellerSidebar, { getSellerActiveNav } from "@/components/seller/SellerSidebar";

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const workspace = useWorkspaceOptional();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isChatWorkspace = pathname === "/chat" || pathname.startsWith("/chat/");
  const isChatbotWorkspace = pathname === "/chatbot" || pathname.startsWith("/chatbot/");
  const isSellerWorkspace =
    pathname.startsWith("/seller") ||
    pathname.startsWith("/browse-buyer-requests") ||
    isChatWorkspace ||
    isChatbotWorkspace;

  const activeRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);
  const isAdminSellerArea = user?.role === "admin" && pathname.startsWith("/seller");
  const showSellerChrome =
    (activeRole === "seller" || isAdminSellerArea) && isSellerWorkspace;

  if (loading || !showSellerChrome) {
    return <>{children}</>;
  }

  const active = getSellerActiveNav(pathname);

  return (
    <div className="relative flex min-h-0 w-full min-h-full flex-1 self-stretch">
      <SellerSidebar
        active={active}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
        <div className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-[#e7f3eb] bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open seller menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-sm font-semibold text-[#0d1b12]">Seller</span>
        </div>
        {children}
      </div>
    </div>
  );
}

