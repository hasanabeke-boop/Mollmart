"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

const navSectionPill =
  "w-fit max-w-full rounded-full bg-[#242424] px-1 py-1 shadow-sm";
const navSectionLink =
  "shrink-0 whitespace-nowrap rounded-full px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-white/10 lg:px-2 lg:text-[10px] xl:px-3 xl:text-[11px] xl:tracking-[0.1em]";

export default function LandingNavigation() {
  const copy = useLandingCopy();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const onLanding = pathname === "/";

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goToSection = (href: string) => {
    setMenuOpen(false);
    if (onLanding) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push(`/${href}`);
  };

  return (
    <>
      <nav
        className={`app-site-header ${
          onLanding
            ? "z-[60] border-b border-transparent bg-transparent"
            : "z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md"
        }`}
      >
        <div className="relative mx-auto grid h-full w-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4 lg:px-6">
          <MollmartLogoLink
            href="/"
            size={32}
            showWordmark
            className="group relative z-[1] shrink-0"
            wordmarkClassName="text-sm font-bold uppercase tracking-[0.08em] text-[#16171a] dark:text-white md:text-base"
            imageClassName="shadow-none transition-transform group-hover:scale-105"
          />

          <div className={`hidden justify-self-center lg:flex ${navSectionPill}`}>
            <div className="flex flex-nowrap items-center gap-0.5">
              {NAV_HREFS.map(({ href, key }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => goToSection(href)}
                  className={navSectionLink}
                >
                  {copy.nav.links[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-[2] flex shrink-0 items-center justify-end gap-2 sm:gap-2.5">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/login"
              className={`hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide shadow-sm transition-colors sm:block ${
                pathname === "/login"
                  ? "border border-[#242424] bg-[#242424] text-white dark:border-white/20 dark:bg-mm-dark-elevated"
                  : "border border-[#242424]/15 bg-white/90 text-[#242424] hover:bg-white dark:border-white/15 dark:bg-mm-dark-elevated/90 dark:text-white dark:hover:bg-mm-dark-elevated"
              }`}
            >
              {copy.nav.login}
            </Link>
            <Link
              href="/register"
              className={`hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition-colors sm:block ${
                pathname === "/register"
                  ? "bg-[#242424] hover:brightness-110"
                  : "bg-mm-primary hover:brightness-110"
              }`}
            >
              {copy.nav.signup}
            </Link>
            <button
              type="button"
              onClick={() => goToSection("#cta")}
              className="hidden rounded-full bg-[#242424] px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-mm-primary md:block"
            >
              {copy.nav.cta}
            </button>

            <button
              type="button"
              className="relative z-[1001] flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full bg-[#242424] dark:bg-mm-dark-elevated dark:ring-1 dark:ring-white/15 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span
                className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[998] flex flex-col items-center justify-center gap-6 bg-mm-bg/95 px-6 backdrop-blur-md transition-all duration-500 dark:bg-mm-dark-bg/95 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav
          className="flex w-full max-w-sm flex-col gap-1"
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s, transform 0.5s",
          }}
        >
          {NAV_HREFS.map(({ href, key }) => (
            <button
              key={href}
              type="button"
              onClick={() => goToSection(href)}
              className="rounded-xl px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-mm-text transition-colors hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/10"
            >
              {copy.nav.links[key]}
            </button>
          ))}
        </nav>
        <div
          className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row"
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s, transform 0.5s",
          }}
        >
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex-1 rounded-full border border-black/[0.08] bg-mm-surface px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-mm-text shadow-sm transition-colors hover:bg-mm-surface-elevated dark:border-white/10 dark:bg-mm-dark-elevated dark:text-white dark:hover:bg-mm-dark-surface"
          >
            {copy.nav.login}
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="flex-1 rounded-full bg-mm-primary px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:brightness-110"
          >
            {copy.nav.signup}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => goToSection("#cta")}
          className="w-full max-w-sm rounded-full bg-[#242424] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-mm-primary dark:bg-mm-dark-elevated dark:ring-1 dark:ring-white/10 dark:hover:bg-mm-primary"
          style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s, transform 0.5s",
          }}
        >
          {copy.nav.cta}
        </button>
      </div>
    </>
  );
}
