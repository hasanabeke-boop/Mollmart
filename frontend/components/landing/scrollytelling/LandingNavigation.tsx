"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MollmartLogoLink } from "@/components/brand/MollmartLogo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useLandingCopy } from "@/hooks/useLandingCopy";

const NAV_HREFS = [
  { href: "#hero", key: "home" as const },
  { href: "#problem", key: "problem" as const },
  { href: "#features", key: "features" as const },
  { href: "#buyers", key: "buyers" as const },
  { href: "#sellers", key: "sellers" as const },
  { href: "#faq", key: "faq" as const },
];

export default function LandingNavigation() {
  const copy = useLandingCopy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const scrollToSection = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const linkClass =
    "text-[11px] font-medium uppercase tracking-[0.12em] text-[#16171a] transition-colors hover:text-mm-primary";

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-[999] h-[72px] transition-all duration-300 md:h-[88px] ${
          scrolled
            ? "border-b border-[#e7e7e7] bg-[#f6f6f6]/95 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <MollmartLogoLink
            href="/"
            size={32}
            showWordmark
            className="group"
            wordmarkClassName="text-sm font-bold uppercase tracking-[0.08em] text-[#16171a] md:text-base"
            imageClassName="shadow-none transition-transform group-hover:scale-105"
          />

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_HREFS.map(({ href, key }) => (
              <button
                key={href}
                type="button"
                onClick={() => scrollToSection(href)}
                className={linkClass}
              >
                {copy.nav.links[key]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[#16171a] transition-colors hover:text-mm-primary sm:block"
            >
              {copy.nav.login}
            </Link>
            <Link
              href="/register"
              className="hidden text-sm font-semibold text-[#16171a] transition-colors hover:text-mm-primary sm:block"
            >
              {copy.nav.signup}
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("#cta")}
              className="hidden rounded-full bg-[#242424] px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-mm-primary md:block"
            >
              {copy.nav.cta}
            </button>

            <button
              type="button"
              className="relative z-[1001] flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span
                className={`h-0.5 w-6 bg-[#16171a] transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-[#16171a] transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-[#16171a] transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[998] flex flex-col items-center justify-center gap-8 bg-[#f6f6f6] transition-all duration-500 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {NAV_HREFS.map(({ href, key }, i) => (
          <button
            key={href}
            type="button"
            onClick={() => scrollToSection(href)}
            className="text-[28px] font-medium uppercase leading-none tracking-tight text-[#16171a] transition-all hover:text-mm-primary"
            style={{
              transitionDelay: menuOpen ? `${i * 50}ms` : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            }}
          >
            {copy.nav.links[key]}
          </button>
        ))}
        <Link
          href="/register"
          className="mt-2 rounded-full bg-mm-primary px-8 py-3 text-sm font-semibold uppercase text-white"
          style={{
            transitionDelay: menuOpen ? `${NAV_HREFS.length * 50}ms` : "0ms",
            opacity: menuOpen ? 1 : 0,
          }}
        >
          {copy.nav.signup}
        </Link>
      </div>
    </>
  );
}
