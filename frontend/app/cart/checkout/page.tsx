"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/chat");
  }, [router]);
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-500">
      Checkout moved to chat after you agree on a price. Redirecting…
    </main>
  );
}
