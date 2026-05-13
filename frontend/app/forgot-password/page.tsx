'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy URL: sends users to the login screen with the forgot-password modal open.
 * The actual reset flow lives on /login (modal) + email link to /reset-password/:token.
 */
export default function ForgotPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?forgot=1");
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-8">
      <p className="text-sm font-medium text-slate-500">Redirecting to sign in…</p>
    </div>
  );
}
