"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/browse-buyer-requests");
  }, [router]);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-500">
      This old route now redirects to buyer requests.
    </main>
  );
}
