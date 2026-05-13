'use client';

import { Search } from 'lucide-react';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetchWithRefresh } from "@/lib/api";
import { fetchShopCart } from "@/lib/shop";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [notifCount, setNotifCount] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role === "seller") {
      setCartCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchShopCart();
        const n = (d.items ?? []).reduce((s, i) => s + i.quantity, 0);
        if (!cancelled) setCartCount(n);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifCount(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const d = await apiFetchWithRefresh<{ count?: number }>("/api/v1/notifications/unread-count", {
          service: "notification",
        });
        const c = typeof d?.count === "number" ? d.count : 0;
        if (!cancelled) setNotifCount(c);
      } catch {
        if (!cancelled) setNotifCount(null);
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
    if (user?.role === "buyer") {
      router.push(q ? `/my-requests` : "/my-requests");
      return;
    }
    router.push(q ? `/browse-buyer-requests?q=${encodeURIComponent(q)}` : "/browse-buyer-requests");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white">storefront</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#0d1b12] group-hover:text-primary transition-colors">
              Mollmart
            </h2>
          </Link>

          <form className="hidden md:flex" onSubmit={handleSearch}>
            <label className="relative flex w-[400px] items-center group">
              <span className="absolute left-3 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full rounded-lg border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#0d1b12] placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all duration-300 shadow-sm focus:shadow-md"
                placeholder="Search requests, categories, or sellers..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </form>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 lg:flex">
            {user?.role === "buyer" ? (
              <Link
                className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                href="/my-requests"
              >
                My requests
              </Link>
            ) : (
              <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/browse-buyer-requests">
                Browse
              </Link>
            )}
            {user?.role !== "seller" && (
              <Link
                className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                href="/products"
              >
                Catalog
              </Link>
            )}
            {user && (
              <Link
                className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                href="/orders"
              >
                {user.role === "seller" ? "Shop orders" : "Orders"}
              </Link>
            )}
            {(!user || user.role === "seller" || user.role === "admin") && (
              <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/seller/dashboard">
                Sell
              </Link>
            )}
            {(user?.role === "seller" || user?.role === "admin") && (
              <Link
                className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
                href="/seller/products/new"
              >
                New catalog product
              </Link>
            )}
            {(!user || user.role === "buyer" || user.role === "admin") && (
              <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/create-product-request">
                Post Request
              </Link>
            )}
          </nav>

          {loading ? (
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.role !== "seller" && (
                <Link
                  href="/cart"
                  className="relative flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12]"
                  aria-label="Shopping cart"
                >
                  <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                  {cartCount != null && cartCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black border-2 border-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              )}
              <Link
                href="/chat"
                className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </Link>
              <Link
                href="/notifications"
                className="relative flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
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
                  className="flex items-center gap-2 rounded-full hover:bg-gray-100 transition-colors p-1 pl-3"
                >
                  <span className="hidden sm:block text-sm font-semibold text-[#0d1b12] max-w-[120px] truncate">
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
                    {user.role !== "seller" && (
                      <Link
                        href="/cart"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                        Cart
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      {user.role === "seller" ? "Shop orders" : "My orders"}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile
                    </Link>
                    {user.role !== "seller" && (
                      <Link
                        href="/my-requests"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                        My Requests
                      </Link>
                    )}
                    {(user.role === "seller" || user.role === "admin") && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                        Seller Dashboard
                      </Link>
                    )}
                    {(user.role === "seller" || user.role === "admin") && (
                      <Link
                        href="/seller/products/new"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        New catalog product
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
