'use client';

import { Search } from 'lucide-react';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import { MollmartLogoLink } from "@/components/brand/MollmartLogo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import WorkspaceModeToggle from "@/components/nav/WorkspaceModeToggle";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { apiFetchWithRefresh } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const iconBtnClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors";

export function Header() {
  const { user, loading, logout } = useAuth();
  const workspace = useWorkspaceOptional();
  const router = useRouter();
  const navRole =
    user?.role === "admin" ? "admin" : (workspace?.activeRole ?? user?.role);
  const navFaded = workspace?.modeScreenVisible === false;
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifState, setNotifState] = useState<{ userId: string; count: number | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

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

  const iconBtn = `${iconBtnClass} text-[var(--foreground)] hover:bg-[var(--surface-hover)]`;

  return (
    <header className="sticky top-0 z-50 box-border flex h-14 w-full shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md transition-colors duration-300 supports-[backdrop-filter]:bg-[var(--surface)]/80 xl:h-16">
      <div
        className={`mx-auto flex h-full w-full min-w-0 max-w-[1600px] items-center gap-2 px-3 transition-opacity duration-300 sm:gap-3 sm:px-4 md:px-5 lg:px-6 ${
          navFaded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MollmartLogoLink href="/" size={32} className="shrink-0" />

        {user && (
          <form
            className="hidden min-w-0 flex-1 sm:mx-2 sm:block sm:max-w-md md:max-w-lg lg:max-w-xl"
            onSubmit={handleSearch}
          >
            <label className="group relative flex w-full items-center">
              <span className="absolute left-2.5 flex items-center text-[var(--text-muted)] group-focus-within:text-primary">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                className="w-full rounded-lg border border-transparent bg-[var(--surface-muted)] py-2 pl-8 pr-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-primary focus:ring-2 focus:ring-primary/30 xl:py-2.5 xl:text-sm"
                placeholder="Search…"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </form>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ThemeToggle />
          <LanguageSwitcher />

          {loading ? (
            <div className="ml-1 h-8 w-16 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          ) : user ? (
            <>
              <div className="hidden md:block">
                <WorkspaceModeToggle />
              </div>
              <Link href="/chat" className={iconBtn} aria-label="Messages">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </Link>
              <Link href="/chatbot" className={`${iconBtn} hidden sm:flex`} aria-label="Assistant">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </Link>
              <Link href="/notifications" className={`${iconBtn} relative`} aria-label="Notifications">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifCount != null && notifCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--surface)] bg-primary px-1 text-[10px] font-bold text-[#0d1b12]">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                ) : null}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center rounded-full p-0.5 transition-colors hover:bg-[var(--surface-hover)] sm:pl-1"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl sm:top-12 sm:w-56">
                    <div className="border-b border-[var(--border)] px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {user.name || "User"}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile
                    </Link>
                    <div className="mt-1 border-t border-[var(--border)] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/chatbot" className={`${iconBtn} sm:flex`} aria-label="Assistant">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </Link>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] sm:block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-[#0d1b12] shadow-sm hover:opacity-90 sm:px-4"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
