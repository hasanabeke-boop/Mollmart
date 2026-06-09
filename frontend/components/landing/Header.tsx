'use client';

import Link from "next/link";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import { MollmartLogoLink } from "@/components/brand/MollmartLogo";
import AiMark from "@/components/chatbot/AiMark";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import WorkspaceModeToggle from "@/components/nav/WorkspaceModeToggle";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { apiFetchWithRefresh } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, logout } = useAuth();
  const workspace = useWorkspaceOptional();
  const router = useRouter();
  const navRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    if (navRole === "buyer") {
      router.push(q ? `/my-requests?q=${encodeURIComponent(q)}` : "/my-requests");
      return;
    }
    router.push(q ? `/browse-buyer-requests?q=${encodeURIComponent(q)}` : "/browse-buyer-requests");
  };

  return (
    <header className="app-site-header border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto grid h-full min-w-0 max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
        <div className="flex min-w-0 items-center">
          <MollmartLogoLink href="/" size={32} />
        </div>

        <form
          className="hidden min-w-0 justify-center px-2 md:flex"
          onSubmit={handleSearch}
        >
          <div className="w-full max-w-md lg:max-w-xl">
            <SearchField value={search} onChange={setSearch} width="full" placeholder="Search…" />
          </div>
        </form>

        <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1.5 lg:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {loading ? (
            <div className="h-8 w-14 animate-pulse rounded-lg bg-[var(--surface-hover)]" />
          ) : user ? (
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              <div className="hidden md:block">
                <WorkspaceModeToggle />
              </div>
              <Link
                href="/chat"
                className="flex size-10 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] sm:size-9"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </Link>
              <Link
                href="/chatbot"
                className="flex size-10 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] sm:size-9"
                aria-label="Assistant chat"
              >
                <AiMark size="xs" />
              </Link>
              <Link
                href="/notifications"
                className="relative flex size-10 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] sm:size-9"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifCount != null && notifCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--surface)] bg-primary px-1 text-[10px] font-bold text-black">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                ) : null}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 rounded-full p-1 pl-2 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <span className="hidden max-w-[4.5rem] truncate text-xs font-semibold text-[var(--foreground)] lg:block xl:max-w-[6rem] xl:text-sm">
                    {user.name || user.email}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-xl">
                    <div className="border-b border-[var(--border)] px-4 py-2">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user.name || "User"}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                    </div>
                    {navRole !== "seller" && navRole !== "admin" && (
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      Order history
                    </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile
                    </Link>
                    {navRole !== "seller" && navRole !== "admin" && (
                      <Link
                        href="/my-requests"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                        My Requests
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/analytics"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                        Seller Dashboard
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/showcase"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        My showcase
                      </Link>
                    )}
                    {(navRole === "seller" || navRole === "admin") && (
                      <Link
                        href="/seller/products/new"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        New showcase listing
                      </Link>
                    )}
                    <div className="mt-1 border-t border-[var(--border)] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
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
                className="flex size-9 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
                aria-label="Assistant chat"
              >
                <AiMark size="xs" />
              </Link>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] sm:block"
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
