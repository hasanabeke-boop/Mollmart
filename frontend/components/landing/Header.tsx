'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import { MollmartLogoLink } from "@/components/brand/MollmartLogo";
import WorkspaceModeToggle from "@/components/nav/WorkspaceModeToggle";
import { apiFetchWithRefresh } from "@/lib/api";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { user, loading, logout } = useAuth();
  const workspace = useWorkspaceOptional();
  const navRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifState, setNotifState] = useState<{ userId: string; count: number | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.id;
    let cancelled = false;
    const load = async () => {
      try {
        const d = await apiFetchWithRefresh<{ count?: number }>("/api/v1/notifications/unread-count", {
          service: "notification",
        });
        const c = typeof d?.count === "number" ? d.count : 0;
        if (!cancelled) setNotifState({ userId, count: c });
      } catch {
        if (!cancelled) setNotifState({ userId, count: null });
      }
    };
    void load();
    const t = setInterval(load, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  const notifCount = user && notifState?.userId === user.id ? notifState.count : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 box-border flex h-14 w-full shrink-0 border-b border-gray-100 bg-white/90 backdrop-blur-md xl:h-16">
      <div className="mx-auto flex h-full min-w-0 max-w-[1600px] flex-1 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <MollmartLogoLink href="/" size={32} />
        </div>


        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
          {loading ? (
            <div className="h-8 w-14 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <WorkspaceModeToggle />
              <Link
                href="/chat"
                className="flex size-9 items-center justify-center rounded-full text-[#0d1b12] transition-colors hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </Link>
              <Link
                href="/chatbot"
                className="flex size-9 items-center justify-center rounded-full text-[#0d1b12] transition-colors hover:bg-gray-100"
                aria-label="Assistant chat"
              >
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              </Link>
              <Link
                href="/notifications"
                className="relative flex size-9 items-center justify-center rounded-full text-[#0d1b12] transition-colors hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifCount != null && notifCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black border-2 border-white">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                ) : null}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 rounded-full p-1 pl-2 transition-colors hover:bg-gray-100"
                >
                  <span className="hidden max-w-[4.5rem] truncate text-xs font-semibold text-[#0d1b12] lg:block xl:max-w-[6rem] xl:text-sm">
                    {user.name || user.email}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-[#0d1b12] truncate">{user.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {navRole !== "seller" && navRole !== "admin" && (
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      Order history
                    </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile
                    </Link>
                    {navRole === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                        Admin panel
                      </Link>
                    )}
                    {navRole !== "seller" && navRole !== "admin" && (
                      <Link
                        href="/my-requests"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                        My Requests
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                        Seller Dashboard
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/showcase"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        My showcase
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/products/new"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        New showcase listing
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/chatbot"
                className="flex size-9 items-center justify-center rounded-full text-[#0d1b12] transition-colors hover:bg-gray-100"
                aria-label="Assistant chat"
              >
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              </Link>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-bold text-[#0d1b12] hover:bg-black/5 sm:block transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 hover:bg-[var(--primary-hover)]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

