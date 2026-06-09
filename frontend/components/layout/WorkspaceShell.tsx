'use client';

import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import BuyerSidebar, { getBuyerActiveNav, type BuyerNavId } from "@/components/buyer/BuyerSidebar";
import SellerSidebar, { getSellerActiveNav, type SellerNavId } from "@/components/seller/SellerSidebar";
import WorkspaceModeToggle from "@/components/nav/WorkspaceModeToggle";
import { SearchField } from "@/components/ui/SearchField";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

function isAuthOnlyPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/confirm-password-change") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth/")
  );
}

function isLandingPath(pathname: string) {
  return pathname === "/";
}

const BUYER_PAGE_TITLES: Partial<Record<BuyerNavId, string>> = {
  my_requests: "My requests",
  post_request: "Post request",
  catalog: "Catalog",
  cart: "Cart",
  orders: "Orders",
  messages: "Messages",
  assistant: "Assistant",
};

const SELLER_PAGE_TITLES: Partial<Record<SellerNavId, string>> = {
  dashboard: "Dashboard",
  my_listings: "My listings",
  new_listing: "New product",
  requests: "Buyer requests",
  auctions: "Active auctions",
  orders: "Orders",
  messages: "Messages",
  assistant: "Assistant",
};

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const workspace = useWorkspaceOptional();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");

  const activeRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);

  const showSellerSidebar = activeRole === "seller" || user?.role === "admin";
  const buyerNavId = getBuyerActiveNav(pathname);
  const sellerNavId = getSellerActiveNav(pathname);
  const pageTitle = showSellerSidebar
    ? (SELLER_PAGE_TITLES[sellerNavId] ?? "Seller")
    : (BUYER_PAGE_TITLES[buyerNavId] ?? "Buyer");

  const handleMobileSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const q = mobileSearch.trim();
      if (showSellerSidebar) {
        router.push(q ? `/browse-buyer-requests?q=${encodeURIComponent(q)}` : "/browse-buyer-requests");
      } else {
        router.push(q ? `/my-requests?q=${encodeURIComponent(q)}` : "/my-requests");
      }
    },
    [mobileSearch, router, showSellerSidebar],
  );

  if (loading || !user || isAuthOnlyPath(pathname) || isLandingPath(pathname)) {
    return <>{children}</>;
  }

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout-with-sidebar relative w-full flex-1">
      {showSellerSidebar ? (
        <SellerSidebar
          active={sellerNavId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <BuyerSidebar
          active={buyerNavId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-[var(--app-header-height)] z-30 flex shrink-0 flex-col border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
          <div className="flex h-12 items-center gap-2 px-3 sm:px-4">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">
              {pageTitle}
            </p>
            <WorkspaceModeToggle compact />
          </div>
          <form className="border-t border-[var(--border)] px-3 pb-3 pt-2 sm:px-4" onSubmit={handleMobileSearch}>
            <div className="app-search-form mx-auto w-full">
              <SearchField
                value={mobileSearch}
                onChange={setMobileSearch}
                width="full"
                placeholder="Search…"
                clearable={false}
              />
            </div>
          </form>
        </div>

        <div
          className={`app-main-content min-w-0 flex-1${
            pathname === "/chat" || pathname.startsWith("/chat/") ? " app-main-content--flush-bottom" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
