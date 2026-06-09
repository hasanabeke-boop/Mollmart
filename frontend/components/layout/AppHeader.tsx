"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/landing/Header";
import LandingNavigation from "@/components/landing/scrollytelling/LandingNavigation";

function usesLandingNav(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth/")
  );
}

/** Global site header — fixed at top with spacer so content never sits underneath. */
export default function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <>
      {usesLandingNav(pathname) ? <LandingNavigation /> : <Header />}
      <div className="app-header-spacer" aria-hidden="true" />
    </>
  );
}
