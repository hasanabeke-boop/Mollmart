"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { checkoutCart, fetchCart, type CartItem } from "@/lib/shop";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    checkoutCurrency: "USD",
  });

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
    setSubmitting(true);
    setError("");
    try {
      const data = await checkoutCart({
        checkoutCurrency: form.checkoutCurrency,
        shippingName: form.shippingName.trim(),
        shippingPhone: form.shippingPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0d1b12]">Checkout</h1>
        <p className="mt-1 text-sm text-[#4c9a66]">Demo checkout creates orders and reserves stock.</p>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-[#cfe7d7] bg-white p-5">
          <h2 className="text-lg font-black text-[#0d1b12]">Shipping details</h2>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Name</span>
              <input
                value={form.shippingName}
                onChange={(e) => setForm((s) => ({ ...s, shippingName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                value={form.shippingPhone}
                onChange={(e) => setForm((s) => ({ ...s, shippingPhone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <textarea
                value={form.shippingAddress}
                onChange={(e) => setForm((s) => ({ ...s, shippingAddress: e.target.value }))}
                className="mt-1 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Checkout currency</span>
              <select
                value={form.checkoutCurrency}
                onChange={(e) => setForm((s) => ({ ...s, checkoutCurrency: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {["USD", "EUR", "RUB", "KZT"].map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-[#cfe7d7] bg-white p-5">
          <h2 className="text-lg font-black text-[#0d1b12]">Order summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="line-clamp-2">{item.title} x {item.quantity}</span>
                <span className="font-bold">{formatCatalogMoney(item.unitPrice * item.quantity, item.currency, 2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 flex justify-between">
            <span className="font-bold">Subtotal</span>
            <span className="font-black">{formatCatalogMoney(subtotal, items[0]?.currency ?? "USD", 2)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-[#0d1b12] hover:bg-[#0fd650] disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place demo order"}
          </button>
        </aside>
      </form>
    </main>
  );
}
