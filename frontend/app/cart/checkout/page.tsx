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
      Demo payment now happens in chat after both sides agree on a price.
    </main>
  );
}
