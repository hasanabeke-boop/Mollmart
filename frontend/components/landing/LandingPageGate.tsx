'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAuthenticatedHomePath } from "@/lib/authRoutes";
import ScrollytellingLanding from "@/components/landing/scrollytelling/ScrollytellingLanding";

export default function LandingPageGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getAuthenticatedHomePath(user));
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-primary" />
      </div>
    );
  }

  return <ScrollytellingLanding />;
}
