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
  "max-w-full rounded-full bg-[#242424] px-1 py-1 shadow-sm";
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
      <nav className="fixed inset-x-0 top-0 z-[999] h-[72px] border-b border-transparent bg-transparent md:h-[88px]">
        <div className="relative mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
          <MollmartLogoLink
            href="/"
            size={32}
            showWordmark
            className="group relative z-[1] shrink-0"
            wordmarkClassName="text-sm font-bold uppercase tracking-[0.08em] text-[#16171a] md:text-base"
            imageClassName="shadow-none transition-transform group-hover:scale-105"
          />

          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 hidden max-w-[calc(100%-17rem)] -translate-x-1/2 -translate-y-1/2 lg:flex lg:max-w-[calc(100%-26rem)] xl:max-w-[calc(100%-30rem)] ${navSectionPill}`}
          >
            <div className="pointer-events-auto flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

          <div className="relative z-[2] flex shrink-0 translate-x-1 items-center gap-2 sm:translate-x-1.5 sm:gap-2.5 lg:translate-x-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/login"
              className={`hidden rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide shadow-sm transition-colors sm:block ${
                pathname === "/login"
                  ? "border border-[#242424] bg-[#242424] text-white"
                  : "border border-[#242424]/15 bg-white/90 text-[#242424] hover:bg-white"
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
              className="relative z-[1001] flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full bg-[#242424] lg:hidden"
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
        className={`fixed inset-0 z-[998] flex flex-col items-center justify-center gap-4 bg-[#f6f6f6] px-6 transition-all duration-500 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
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
            className="flex-1 rounded-full border border-[#242424]/15 bg-white px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-[#242424] shadow-sm"
          >
            {copy.nav.login}
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-full bg-mm-primary px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-sm"
          >
            {copy.nav.signup}
          </Link>
        </div>
      </div>
    </>
  );
}
