"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import ShippingFields from "@/components/shipping/ShippingFields";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { formatCatalogMoney } from "@/lib/catalog";
import { EMPTY_SHIPPING, validateShipping } from "@/lib/shipping";
import { checkoutCart, fetchCart, type CartItem } from "@/lib/shop";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_SHIPPING);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchCart();
      setItems(data.items ?? []);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/cart/checkout")}`);
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateShipping(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await checkoutCart({
        checkoutCurrency: DEFAULT_CURRENCY,
        ...form,
      });
      const firstOrder = data.orders[0];
      router.replace(firstOrder ? `/orders/${firstOrder.id}` : "/orders");
    } catch (err: unknown) {
      setError((err as Error).message || "Checkout failed");
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <main className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Loading...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-[#0d1b12]">
          Browse products
        </Link>
      </main>
    );
  }

  const ready = validateShipping(form) == null;

  return (
    <main className="app-page app-page-narrow">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0d1b12]">Checkout</h1>
        <p className="mt-1 text-sm text-[#4c9a66]">
          Submit your delivery details to create the order. Payment and delivery are arranged directly with the seller.
        </p>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#cfe7d7] bg-white p-5">
            <h2 className="text-lg font-black text-[#0d1b12]">Delivery details</h2>
            <div className="mt-4">
              <ShippingFields value={form} onChange={(patch) => setForm((s) => ({ ...s, ...patch }))} />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-[#cfe7d7] bg-white p-5">
          <h2 className="text-lg font-black text-[#0d1b12]">Order summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="line-clamp-2">{item.title} x {item.quantity}</span>
                <span className="font-bold">{formatCatalogMoney(item.unitPrice * item.quantity, DEFAULT_CURRENCY, 2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-bold">Agreed total</span>
              <span className="text-right font-black text-[#0d1b12]">
                {formatCatalogMoney(Math.round(subtotal * 100) / 100, DEFAULT_CURRENCY, 2)}
              </span>
            </div>
            <p className="text-xs text-[#4c9a66]">Price is recorded for order history. No online payment on the platform.</p>
          </div>
          <button
            type="submit"
            disabled={submitting || !ready}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-[#0d1b12] hover:bg-[#0fd650] disabled:opacity-60"
          >
            {submitting ? "Creating order…" : "Submit delivery details"}
          </button>
        </aside>
      </form>
    </main>
  );
}
