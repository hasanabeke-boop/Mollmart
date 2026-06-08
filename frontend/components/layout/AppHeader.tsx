"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/landing/Header";
import LandingNavigation from "@/components/landing/scrollytelling/LandingNavigation";

function usesLandingNav(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

/** Global app header — landing nav on home (in page), login/register; app header elsewhere. */
export default function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  if (usesLandingNav(pathname)) return <LandingNavigation />;
  return <Header />;
}
