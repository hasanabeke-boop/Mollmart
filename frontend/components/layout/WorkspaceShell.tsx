'use client';

import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import BuyerSidebar, { getBuyerActiveNav } from "@/components/buyer/BuyerSidebar";
import SellerSidebar, { getSellerActiveNav } from "@/components/seller/SellerSidebar";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

function isChatPath(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/");
}

function isChatbotPath(pathname: string) {
  return pathname === "/chatbot" || pathname.startsWith("/chatbot/");
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const workspace = useWorkspaceOptional();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);

  const isBuyerWorkspace =
    pathname.startsWith("/my-requests") ||
    pathname.startsWith("/create-product-request") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/products") ||
    isChatPath(pathname) ||
    isChatbotPath(pathname);

  const isSellerWorkspace =
    pathname.startsWith("/seller") ||
    pathname.startsWith("/browse-buyer-requests") ||
    isChatPath(pathname) ||
    isChatbotPath(pathname);

  const isAdminSellerArea = user?.role === "admin" && pathname.startsWith("/seller");
  const showBuyerChrome = activeRole === "buyer" && isBuyerWorkspace;
  const showSellerChrome =
    (activeRole === "seller" || isAdminSellerArea) && isSellerWorkspace;

  if (loading || !user || (!showBuyerChrome && !showSellerChrome)) {
    return <>{children}</>;
  }

  const modeLabel = showBuyerChrome ? "Buyer" : "Seller";

  return (
    <div className="app-layout-with-sidebar relative w-full flex-1">
      {showBuyerChrome ? (
        <BuyerSidebar
          active={getBuyerActiveNav(pathname)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <SellerSidebar
          active={getSellerActiveNav(pathname)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-0 w-full min-h-full flex-1 flex-col">
        <div className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-[#e7f3eb] bg-white/95 px-4 backdrop-blur lg:hidden">
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

