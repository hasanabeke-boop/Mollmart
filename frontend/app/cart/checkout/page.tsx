"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { convertViaBase, fetchLatestRates, type FxRatesResponse } from "@/lib/fxRates";
import { createCartStripeCheckoutSession, fetchPaymentConfig } from "@/lib/payments";
import { checkoutCart, fetchCart, type CartItem } from "@/lib/shop";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fxRates, setFxRates] = useState<FxRatesResponse | null>(null);
  const [fxError, setFxError] = useState("");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [form, setForm] = useState({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    checkoutCurrency: "USD",
    cardHolderName: "",
    cardLast4: "",
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

  useEffect(() => {
    fetchPaymentConfig()
      .then((config) => setStripeEnabled(config.stripeEnabled))
      .catch(() => setStripeEnabled(false));
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const originalSubtotalCurrency = items.every((item) => item.currency === items[0]?.currency)
    ? items[0]?.currency
    : null;
  const checkoutCurrency = form.checkoutCurrency.toUpperCase();
  const convertedLines = useMemo(() => {
    return items.map((item) => {
      const originalTotal = item.unitPrice * item.quantity;
      const convertedTotal =
        item.currency.toUpperCase() === checkoutCurrency
          ? originalTotal
          : fxRates
            ? convertViaBase(originalTotal, item.currency, checkoutCurrency, fxRates.base, fxRates.rates)
            : null;
      return {
        ...item,
        convertedTotal: convertedTotal == null ? null : Math.round(convertedTotal * 100) / 100,
      };
    });
  }, [checkoutCurrency, fxRates, items]);
  const convertedSubtotal = convertedLines.every((item) => item.convertedTotal != null)
    ? convertedLines.reduce((sum, item) => sum + (item.convertedTotal ?? 0), 0)
    : null;

  useEffect(() => {
    if (items.length === 0) return;
    const needsFx = items.some((item) => item.currency.toUpperCase() !== checkoutCurrency);
    if (!needsFx) {
      setFxError("");
      return;
    }
    let cancelled = false;
    setFxError("");
    fetchLatestRates("KZT")
      .then((rates) => {
        if (!cancelled) setFxRates(rates);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFxError((err as Error).message || "Could not load exchange rates.");
      });
    return () => {
      cancelled = true;
    };
  }, [checkoutCurrency, items]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripeEnabled && form.cardHolderName.trim().length < 2) {
      setError("Enter the name on the demo card.");
      return;
    }
    if (!stripeEnabled && form.cardLast4.length !== 4) {
      setError("Enter the last 4 digits of the demo card.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (stripeEnabled) {
        const session = await createCartStripeCheckoutSession({
          checkoutCurrency: form.checkoutCurrency,
          shippingName: form.shippingName.trim(),
          shippingPhone: form.shippingPhone.trim(),
          shippingAddress: form.shippingAddress.trim(),
        });
        window.location.href = session.url;
        return;
      }
      const data = await checkoutCart({
        checkoutCurrency: form.checkoutCurrency,
        shippingName: form.shippingName.trim(),
        shippingPhone: form.shippingPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        cardHolderName: form.cardHolderName.trim(),
        cardLast4: form.cardLast4,
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
        <p className="mt-1 text-sm text-[#4c9a66]">
          {stripeEnabled
            ? "Stripe checkout takes the advance payment, then creates orders after confirmation."
            : "Demo checkout simulates payment, creates orders, and reserves stock."}
        </p>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
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

          <section className="rounded-xl border border-[#cfe7d7] bg-white p-5">
            <h2 className="text-lg font-black text-[#0d1b12]">Demo payment</h2>
            <p className="mt-1 text-sm text-[#4c9a66]">
              {stripeEnabled
                ? "You will enter card details on Stripe's secure checkout page."
                : "This is an advance demo payment for the order. No real card is charged."}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {!stripeEnabled ? (
                <>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Name on card</span>
                    <input
                      value={form.cardHolderName}
                      onChange={(e) => setForm((s) => ({ ...s, cardHolderName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Jane Buyer"
                      autoComplete="cc-name"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Last 4 digits</span>
                    <input
                      value={form.cardLast4}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, cardLast4: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-widest"
                      placeholder="4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      required
                    />
                  </label>
                </>
              ) : null}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Payment status: <span className="font-bold">{stripeEnabled ? "Stripe" : "simulated"}</span>
                <br />
                Orders are created immediately after confirmation.
              </div>
            </div>
          </section>
        </div>

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
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            {originalSubtotalCurrency ? (
              <div className="flex justify-between">
                <span className="font-bold">Original subtotal</span>
                <span className="font-black">{formatCatalogMoney(subtotal, originalSubtotalCurrency, 2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-bold">Pay today</span>
              <span className="text-right font-black text-[#0d1b12]">
                {convertedSubtotal == null
                  ? "Calculating..."
                  : formatCatalogMoney(Math.round(convertedSubtotal * 100) / 100, checkoutCurrency, 2)}
              </span>
            </div>
            {fxError ? <p className="text-xs text-red-600">{fxError}</p> : null}
            <p className="text-xs text-[#4c9a66]">
              Final order totals are saved in {checkoutCurrency}. Shipping is 0 in demo mode.
            </p>
          </div>
          <button
            type="submit"
            disabled={
              submitting ||
              (!stripeEnabled && (form.cardLast4.length !== 4 || form.cardHolderName.trim().length < 2))
            }
            className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-[#0d1b12] hover:bg-[#0fd650] disabled:opacity-60"
          >
            {submitting
              ? stripeEnabled
                ? "Opening Stripe..."
                : "Processing payment..."
              : stripeEnabled
                ? "Pay with Stripe"
                : "Complete advance payment"}
          </button>
        </aside>
      </form>
    </main>
  );
}
