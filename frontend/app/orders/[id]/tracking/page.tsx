'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchMyOrder, type ShopOrder } from "@/lib/shop";
import {
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  orderTrackingSteps,
  type OrderStatus,
} from "@/lib/orderStatus";

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(`/orders/${id}/tracking`)}`);
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMyOrder(id);
        if (!cancelled) setOrder(data);
      } catch (e: unknown) {
        const err = e as Error & { status?: number };
        if (!cancelled) {
          setOrder(null);
          setError(err.status === 404 ? t("Order not found") : err.message || "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, id, t]);

  const steps = useMemo(
    () => (order ? orderTrackingSteps(order.status as OrderStatus) : []),
    [order],
  );

  if (authLoading || (!user && !error)) {
    return <div className="app-page py-16 text-center text-[var(--text-muted)]">Loading…</div>;
  }

  if (!user) return null;

  if (loading) {
    return <div className="app-page py-16 text-center text-[var(--text-muted)]">Loading…</div>;
  }

  if (error || order == null) {
    return (
      <div className="app-page py-12">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Tracking not found</h1>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error || "Unable to load this order."}</p>
        <Link href="/orders" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("Back to orders")}
        </Link>
      </div>
    );
  }

  const status = order.status as OrderStatus;

  const copyTracking = async () => {
    if (!order.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative flex w-full flex-col bg-[var(--background)] text-[var(--foreground)]">
      <div className="app-page app-page-wide flex grow flex-col">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href="/orders" className="hover:underline">
            {t("Orders")}
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-medium text-[var(--foreground)]">{t("Tracking")}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm">
              <h1 className="text-2xl font-black text-[var(--foreground)] mb-1">{t("Tracking")}</h1>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Order total {formatCatalogMoney(order.total, order.currency, 2)} · Seller {order.seller.name}
              </p>

              <ol className="space-y-4">
                {steps.map((s) => (
                  <li key={s.key} className="flex gap-4">
                    <div
                      className={`mt-1 size-3 rounded-full shrink-0 ${
                        "done" in s && s.done ? "bg-primary" : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-bold ${
                          "current" in s && s.current ? "text-primary" : "text-[var(--foreground)]"
                        }`}
                      >
                        {t(s.label)}
                      </p>
                      {"key" in s && s.key === status ? (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {t(ORDER_STATUS_DESCRIPTIONS[s.key as OrderStatus])}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                href={`/orders/${order.id}`}
                className="inline-flex mt-6 text-sm font-semibold text-primary hover:underline"
              >
                {t("Details")}
              </Link>
            </div>

            {order.trackingNumber ? (
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-2">Tracking number</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="text-sm font-mono bg-[var(--surface-muted)] px-3 py-2 rounded-lg border border-[var(--border)]">
                    {order.trackingNumber}
                  </code>
                  {order.carrier ? <span className="text-sm text-[var(--text-muted)]">{order.carrier}</span> : null}
                  <button
                    type="button"
                    onClick={() => void copyTracking()}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No tracking number yet. The seller can add one when starting work.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
