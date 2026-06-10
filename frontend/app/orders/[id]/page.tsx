'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { resolveUploadedAssetUrl } from "@/lib/api";
import { fetchMyOrder, patchOrderStatus, type ShopOrder } from "@/lib/shop";
import {
  isTerminalOrderStatus,
  nextOrderAction,
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orderStatus";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(`/orders/${id}`)}`);
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMyOrder(id);
        if (!cancelled) {
          setOrder(data);
          setTrackingNumber(data.trackingNumber ?? "");
          setCarrier(data.carrier ?? "");
        }
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

  const isSellerOnOrder = user?.id === order?.sellerId;
  const viewerRole: "buyer" | "seller" = isSellerOnOrder ? "seller" : "buyer";

  const pendingAction = useMemo(() => {
    if (!order) return null;
    return nextOrderAction(order.status as OrderStatus, viewerRole);
  }, [order, viewerRole]);

  const runStatusUpdate = async () => {
    if (!order || !pendingAction) return;
    setSaving(true);
    setActionError("");
    try {
      const body: {
        status: "in_progress" | "awaiting_confirmation" | "completed";
        trackingNumber?: string | null;
        carrier?: string | null;
      } = { status: pendingAction.status };
      if (viewerRole === "seller") {
        body.trackingNumber = trackingNumber.trim() || null;
        body.carrier = carrier.trim() || null;
      }
      const updated = await patchOrderStatus(order.id, body);
      setOrder(updated);
      setTrackingNumber(updated.trackingNumber ?? "");
      setCarrier(updated.carrier ?? "");
    } catch (e: unknown) {
      setActionError((e as Error).message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && !error)) {
    return <div className="app-page py-16 text-center text-[var(--text-muted)]">Loading…</div>;
  }

  if (!user) return null;

  if (loading) {
    return <div className="app-page py-16 text-center text-[var(--text-muted)]">Loading order…</div>;
  }

  if (error || order == null) {
    return (
      <div className="app-page py-12">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{t("Order not found")}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error || "Unable to load this order."}</p>
        <Link href="/orders" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("Back to orders")}
        </Link>
      </div>
    );
  }

  const status = order.status as OrderStatus;
  const placedOn = new Date(order.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="app-page app-page-wide">
      <nav className="flex items-center text-sm font-medium text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/orders" className="hover:text-primary transition-colors">
          {t("Orders")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)] font-semibold">Order</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight mb-2">
            Order details
          </h1>
          <p className="text-[var(--text-muted)]">
            {isSellerOnOrder ? "Sale" : "Placed"} {placedOn} · {order.lines.length} line
            {order.lines.length === 1 ? "" : "s"} · {formatCatalogMoney(order.total, order.currency, 2)}
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">{order.id}</p>
        </div>
        {!isTerminalOrderStatus(status) ? (
          <Link
            href={`/orders/${order.id}/tracking`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-[#0d1b12] text-sm font-bold hover:opacity-90 w-full md:w-auto shadow-md"
          >
            <span className="material-symbols-outlined">route</span>
            {t("Tracking")}
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Status</h3>
            <p className="text-primary font-bold text-xl">{t(ORDER_STATUS_LABELS[status])}</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">{t(ORDER_STATUS_DESCRIPTIONS[status])}</p>
            {order.trackingNumber ? (
              <p className="text-sm text-[var(--text-muted)] mt-3">
                Tracking: <span className="font-mono font-semibold text-[var(--foreground)]">{order.trackingNumber}</span>
                {order.carrier ? ` · ${order.carrier}` : null}
              </p>
            ) : null}

            {pendingAction ? (
              <div className="mt-6 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-muted)] p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t(pendingAction.label)}</p>
                  {pendingAction.hint ? (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{t(pendingAction.hint)}</p>
                  ) : null}
                </div>
                {viewerRole === "seller" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      {t("Tracking number (optional)")}
                      <input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      {t("Carrier (optional)")}
                      <input
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                ) : null}
                {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void runStatusUpdate()}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-[#0d1b12] hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "…" : t("Update status")}
                </button>
              </div>
            ) : null}

            {status === "cancelled" ? (
              <p className="text-xs text-[var(--text-muted)] mt-4">{t("Only admins can cancel orders.")}</p>
            ) : null}
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Items</h3>
            <div className="flex flex-col gap-6">
              {order.lines.map((line) => {
                const itemCover = resolveUploadedAssetUrl(line.imageUrl);
                const itemHref =
                  line.requestId != null && line.requestId.length > 0
                    ? isSellerOnOrder
                      ? "/browse-buyer-requests"
                      : "/my-requests"
                    : `/products/${line.productSlug}`;
                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-[var(--border-muted)] last:border-0 last:pb-0"
                  >
                    <Link
                      href={itemHref}
                      className="size-24 sm:size-28 rounded-lg bg-slate-100 bg-cover bg-center border border-[var(--border)] shrink-0 block"
                      style={itemCover ? { backgroundImage: `url("${itemCover}")` } : undefined}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-[var(--foreground)] text-lg">{line.title}</h4>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            {line.requestId
                              ? "Agreed price for this buyer request."
                              : `Quantity: ${line.quantity}`}
                          </p>
                        </div>
                        <p className="font-bold text-[var(--foreground)]">
                          {formatCatalogMoney(line.unitPrice * line.quantity, line.currency, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">{isSellerOnOrder ? "Buyer" : "Seller"}</h3>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {isSellerOnOrder ? order.buyer.name : order.seller.name}
            </p>
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">{t("Shipping details")}</h3>
            {order.shippingName || order.shippingAddress ? (
              <address className="not-italic text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {order.shippingName ? <span className="font-bold block mb-1">{order.shippingName}</span> : null}
                {order.shippingAddress}
                {order.shippingPhone ? (
                  <span className="text-[var(--text-muted)] mt-2 block">Phone: {order.shippingPhone}</span>
                ) : null}
              </address>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No contact details on file.</p>
            )}
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">{t("Order summary")}</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Subtotal</span>
                <span>{formatCatalogMoney(order.subtotal, order.currency, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Handling</span>
                <span>{formatCatalogMoney(order.shippingAmount, order.currency, 2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--border-muted)]">
                <span>Total</span>
                <span>{formatCatalogMoney(order.total, order.currency, 2)}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">{t("Payment and delivery are arranged directly between buyer and seller.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
