"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/landing/Header";

/** Global app header — hidden on scrollytelling landing (uses its own nav). */
export default function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Header />;
}
