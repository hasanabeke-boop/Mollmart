"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { resolveUploadedAssetUrl } from "@/lib/api";
import { fetchCart, removeCartItem, updateCartItem, type CartItem } from "@/lib/shop";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchCart();
      setItems(data.items ?? []);
    } catch (err: unknown) {
      setError((err as Error).message || t("Failed to load cart"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/cart")}`);
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const currency = items[0]?.currency ?? "KZT";

  const setQuantity = async (item: CartItem, nextQty: number) => {
    setBusyId(item.productId);
    setError("");
    try {
      const next = await updateCartItem(item.productId, nextQty);
      if ("removed" in next) {
        setItems((rows) => rows.filter((row) => row.productId !== item.productId));
      } else {
        setItems((rows) => rows.map((row) => (row.productId === item.productId ? next : row)));
      }
    } catch (err: unknown) {
      setError((err as Error).message || t("Failed to update cart"));
    } finally {
      setBusyId("");
    }
  };

  const remove = async (productId: string) => {
    setBusyId(productId);
    setError("");
    try {
      await removeCartItem(productId);
      setItems((rows) => rows.filter((row) => row.productId !== productId));
    } catch (err: unknown) {
      setError((err as Error).message || t("Failed to remove item"));
    } finally {
      setBusyId("");
    }
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500">
        {t("Loading…")}
      </main>
    );
  }

  return (
    <main className="app-page app-page-narrow">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] sm:text-3xl">{t("Cart")}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t("Review items before checkout.")}</p>
        </div>
        <Link href="/products" className="text-sm font-bold text-primary hover:underline">
          {t("Continue shopping")}
        </Link>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {items.length === 0 ? (
        <div className="app-card rounded-xl px-6 py-12 text-center">
          <p className="text-slate-600">{t("Your cart is empty.")}</p>
          <Link href="/products" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-[#0d1b12]">
            {t("Browse products")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => {
              const thumb = resolveUploadedAssetUrl(item.imageUrl) ?? "";
              return (
                <div key={item.productId} className="app-card flex flex-col gap-4 rounded-xl p-4 sm:flex-row">
                  <Link href={`/products/${item.slug}`} className="size-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {thumb ? <img src={thumb} alt={item.title} className="h-full w-full object-cover" /> : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} className="font-bold text-[#0d1b12] hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-[#4c9a66]">
                      {t("Seller: {name}", { name: item.sellerName })}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{formatCatalogMoney(item.unitPrice, item.currency, 2)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button disabled={busyId === item.productId} onClick={() => setQuantity(item, item.quantity - 1)} className="size-8 rounded border border-slate-200 font-bold">
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button disabled={busyId === item.productId || item.quantity >= item.maxQuantity} onClick={() => setQuantity(item, item.quantity + 1)} className="size-8 rounded border border-slate-200 font-bold">
                        +
                      </button>
                      <button disabled={busyId === item.productId} onClick={() => remove(item.productId)} className="ml-2 text-sm font-semibold text-red-600 hover:underline">
                        {t("Remove")}
                      </button>
                    </div>
                  </div>
                  <p className="text-left font-bold text-[var(--foreground)] sm:text-right">
                    {formatCatalogMoney(item.unitPrice * item.quantity, item.currency, 2)}
                  </p>
                </div>
              );
            })}
          </div>

          <aside className="app-card h-fit rounded-xl p-5 lg:sticky lg:top-[calc(var(--app-header-height)+1rem)]">
            <h2 className="text-lg font-black text-[var(--foreground)]">{t("Summary")}</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span>{t("Subtotal")}</span>
              <span className="font-bold">{formatCatalogMoney(subtotal, currency, 2)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{t("Shipping is demo-only and currently free.")}</p>
            <Link href="/cart/checkout" className="mt-5 flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-[#0d1b12] hover:bg-[#0fd650]">
              {t("Checkout")}
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
