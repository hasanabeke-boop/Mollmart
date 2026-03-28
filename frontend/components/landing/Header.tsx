'use client';

import { Search } from 'lucide-react';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

          <div className="hidden md:flex">
            <label className="relative flex w-[400px] items-center group">
              <span className="absolute left-3 flex items-center text-gray-400 group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full rounded-lg border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#0d1b12] placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all duration-300 shadow-sm focus:shadow-md"
                placeholder="Search for products or demands..."
                type="text"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 lg:flex">
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/browse-buyer-requests">
              Browse
            </Link>
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/seller/dashboard">
              Sell
            </Link>
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="/products">
              Deals
            </Link>
          </nav>

          {loading ? (
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </Link>
              <Link
                href="/notifications"
                className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12] relative"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
              </Link>
              <Link
                href="/cart"
                className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#0d1b12]"
              >
                <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
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
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      My Orders
                    </Link>
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d1b12] hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                      Seller Dashboard
                    </Link>
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
