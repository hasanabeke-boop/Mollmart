'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchMyRequestDealOrder, type RequestDealOrder } from "@/lib/requestDeals";

function stepsForStatus(s: RequestDealOrder["status"]) {
  const base = [
    { key: "processing", label: "Processing", done: false },
    { key: "shipped", label: "Shipped", done: false },
    { key: "delivered", label: "Delivered", done: false },
  ];
  if (s === "cancelled") {
    return [{ key: "cancelled", label: "Cancelled", done: true }];
  }
  const order = ["processing", "shipped", "delivered"];
  const idx = order.indexOf(s);
  return base.map((b, i) => ({
    ...b,
    done: idx >= i,
    current: idx === i,
  }));
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<RequestDealOrder | null>(null);
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
        const data = await fetchMyRequestDealOrder(id);
        if (!cancelled) setOrder(data);
      } catch (e: unknown) {
        const err = e as Error & { status?: number };
        if (!cancelled) {
          setOrder(null);
          setError(err.status === 404 ? "Order not found." : err.message || "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, id]);

  const steps = useMemo(() => (order ? stepsForStatus(order.status) : []), [order]);

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
        <h1 className="text-2xl font-bold text-[#0d1b12] mb-2">Tracking not found</h1>
        <p className="text-sm text-[#4c9a66] mb-4">{error || "Unable to load this order."}</p>
        <Link href="/orders" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to orders
        </Link>
      </div>
    );
  }

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
        <nav className="flex items-center gap-2 text-sm text-[#4c9a66] mb-6">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href="/orders" className="hover:underline">
            Orders
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-medium text-[#0d1b12]">Tracking</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
              <h1 className="text-2xl font-black text-[#0d1b12] mb-1">Tracking status</h1>
              <p className="text-sm text-slate-600 mb-6">
                Order total {formatCatalogMoney(order.total, order.currency, 2)} · Seller {order.seller.name}
              </p>

              <ol className="space-y-4">
                {steps.map((s) => (
                  <li key={s.key} className="flex gap-4">
                    <div
                      className={`mt-1 size-3 rounded-full shrink-0 ${
                        'done' in s && s.done ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className={`font-bold ${'current' in s && s.current ? 'text-primary' : 'text-[#0d1b12]'}`}>
                        {s.label}
                      </p>
                      {'key' in s && s.key === 'processing' ? (
                        <p className="text-xs text-slate-500 mt-0.5">We notified the seller about the paid request deal.</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {order.trackingNumber ? (
              <div className="rounded-2xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-2">Tracking number</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="text-sm font-mono bg-[#f6f8f6] px-3 py-2 rounded-lg border border-[#e7f3eb]">
                    {order.trackingNumber}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyTracking()}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
                {order.carrier ? <p className="text-sm text-slate-600 mt-2">Carrier: {order.carrier}</p> : null}
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-900">
                No tracking number yet. When an admin marks this order as shipped and adds tracking, it will show
                here.
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white border border-[#e7f3eb] p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-[#0d1b12] mb-4">Order</h2>
              <p className="text-xs font-mono text-slate-500 break-all mb-4">{order.id}</p>
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex text-sm font-bold text-primary hover:underline"
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
