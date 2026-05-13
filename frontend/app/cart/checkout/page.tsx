'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CATALOG_CURRENCIES, formatCatalogMoney } from "@/lib/catalog";
import { fetchShopCart, shopCheckout, type ShopCartItem } from "@/lib/shop";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkoutCurrency, setCheckoutCurrency] = useState("USD");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchShopCart();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
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

  const preview = useMemo(() => {
    return items.map((i) => ({
      ...i,
      lineTotal: i.unitPrice * i.quantity,
    }));
  }, [items]);

  const subtotal = useMemo(() => preview.reduce((s, i) => s + i.lineTotal, 0), [preview]);

  const handlePay = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const { orders } = await shopCheckout({
        checkoutCurrency,
        shippingName: shippingName.trim() || undefined,
        shippingPhone: shippingPhone.trim() || undefined,
        shippingAddress: shippingAddress.trim() || undefined,
      });
      const first = orders[0]?.id;
      if (first) {
        router.push(`/orders/${first}`);
      } else {
        router.push("/orders");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!user && !error)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-500">Loading…</div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-[#4c9a66]">
        <Link href="/cart" className="hover:underline">
          Cart
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#0d1b12] font-semibold">Checkout</span>
      </nav>

      <h1 className="text-3xl font-black text-[#0d1b12] mb-2">Checkout</h1>
      <p className="text-sm text-slate-600 mb-8">
        Demo payment: your order is placed immediately in <strong>processing</strong>. Admin can update status and
        tracking.
      </p>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-slate-500">Loading cart…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-600 mb-6">
          Your cart is empty.{" "}
          <Link href="/products" className="text-primary font-semibold underline">
            Browse catalog
          </Link>
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-[#e7f3eb] bg-white p-6 mb-8">
            <h2 className="text-lg font-bold text-[#0d1b12] mb-4">Pay in one currency</h2>
            <label className="block text-sm font-medium text-[#0d1b12] mb-2">Checkout currency</label>
            <select
              value={checkoutCurrency}
              onChange={(e) => setCheckoutCurrency(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-[#e7f3eb] bg-[#f6f8f6] px-3 py-2 text-sm"
            >
              {CATALOG_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Line prices are converted from each product&apos;s listing currency at current rates (same as catalog).
            </p>
          </section>

          <section className="rounded-xl border border-[#e7f3eb] bg-white p-6 mb-8">
            <h2 className="text-lg font-bold text-[#0d1b12] mb-4">Shipping (optional)</h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm"
                placeholder="Full name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm"
                placeholder="Phone"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-[#e7f3eb] px-3 py-2 text-sm min-h-[88px]"
                placeholder="Address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#e7f3eb] bg-white p-6 mb-8">
            <h2 className="text-lg font-bold text-[#0d1b12] mb-4">Items</h2>
            <ul className="divide-y divide-[#e7f3eb]">
              {preview.map((i) => (
                <li key={i.productId} className="py-3 flex justify-between gap-4 text-sm">
                  <span>
                    {i.title} × {i.quantity}
                    <span className="block text-xs text-slate-500">
                      Listed {formatCatalogMoney(i.unitPrice, i.currency, 2)} each
                    </span>
                  </span>
                  <span className="font-semibold shrink-0 text-[#0d1b12]">
                    {formatCatalogMoney(i.lineTotal, i.currency, 2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Final totals per seller order are computed on the server in{" "}
              <strong>{checkoutCurrency}</strong> (one order per seller).
            </p>
          </section>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handlePay()}
            className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-black hover:bg-[#0fd650] disabled:opacity-50"
          >
            {submitting ? "Placing order…" : "Pay & place order (demo)"}
          </button>
        </>
      )}
    </div>
  );
}
