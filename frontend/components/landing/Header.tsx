import { Search } from 'lucide-react'

import Link from "next/link";

export function Header() {
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
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="#">
              Sell
            </Link>
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="#">
              Community
            </Link>
            <Link className="text-sm font-medium text-[#0d1b12] hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full" href="#">
              Deals
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-bold text-[#0d1b12] hover:bg-black/5 sm:block transition-colors"
            >
              Log In
            </Link>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 hover:bg-[var(--primary-hover)]">
              <Link
              href="/register"
              className="hidden rounded-lg px-4 py-2 text-sm font-bold text-[#0d1b12] hover:bg-black/5 sm:block transition-colors"
            >
              Sign Up
            </Link>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

