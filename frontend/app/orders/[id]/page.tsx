'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchMyOrder, type ShopOrder } from "@/lib/shop";

function statusLabel(s: ShopOrder["status"]) {
  switch (s) {
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    default:
      return "Cancelled";
  }
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (authLoading || (!user && !error)) {
    return <div className="mx-auto max-w-[1280px] px-6 py-16 text-center text-slate-500">Loading…</div>;
  }

  if (!user) return null;

  const isSellerView = user.role === "seller";

  if (loading) {
    return <div className="mx-auto max-w-[1280px] px-6 py-16 text-center text-slate-500">Loading order…</div>;
  }

  if (error || order == null) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#0d1b12] mb-2">Order not found</h1>
        <p className="text-sm text-[#4c9a66] mb-4">{error || "Unable to load this order."}</p>
        <Link href="/orders" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to orders
        </Link>
      </div>
    );
  }

  const placedOn = new Date(order.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8">
      <nav className="flex items-center text-sm font-medium text-[#4c9a66] mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/orders" className="hover:text-primary transition-colors">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#0d1b12] font-semibold">Order</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0d1b12] tracking-tight mb-2">Order details</h1>
          <p className="text-[#4c9a66]">
            {isSellerView ? "Sale" : "Placed"} {placedOn} · {order.lines.length} line{order.lines.length === 1 ? "" : "s"} ·{" "}
            {formatCatalogMoney(order.total, order.currency, 2)}
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">{order.id}</p>
        </div>
        <Link
          href={`/orders/${order.id}/tracking`}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-[#0d1b12] text-sm font-bold hover:opacity-90 w-full md:w-auto shadow-md"
        >
          <span className="material-symbols-outlined">local_shipping</span>
          Tracking
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-2">Status</h3>
            <p className="text-primary font-bold text-xl">{statusLabel(order.status)}</p>
            {order.trackingNumber ? (
              <p className="text-sm text-slate-600 mt-2">
                Tracking: <span className="font-mono font-semibold">{order.trackingNumber}</span>
                {order.carrier ? ` · ${order.carrier}` : null}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-2">Tracking will appear when the order ships.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-6">Items</h3>
            <div className="flex flex-col gap-6">
              {order.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-[#e7f3eb] last:border-0 last:pb-0"
                >
                  <Link
                    href={`/products/${line.productSlug}`}
                    className="size-24 sm:size-28 rounded-lg bg-cover bg-center border border-[#e7f3eb] shrink-0 block"
                    style={{ backgroundImage: `url("${line.imageUrl}")` }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-[#0d1b12] text-lg">{line.title}</h4>
                        <p className="text-sm text-[#4c9a66] mt-1">Qty {line.quantity}</p>
                      </div>
                      <p className="font-bold text-[#0d1b12]">
                        {formatCatalogMoney(line.unitPrice * line.quantity, line.currency, 2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4">{isSellerView ? "Buyer" : "Seller"}</h3>
            <p className="text-sm font-semibold text-[#0d1b12]">
              {isSellerView ? order.buyer.name : order.seller.name}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4">Shipping</h3>
            {order.shippingName || order.shippingAddress ? (
              <address className="not-italic text-sm text-[#0d1b12] leading-relaxed whitespace-pre-wrap">
                {order.shippingName ? <span className="font-bold block mb-1">{order.shippingName}</span> : null}
                {order.shippingAddress}
                {order.shippingPhone ? (
                  <span className="text-[#4c9a66] mt-2 block">Phone: {order.shippingPhone}</span>
                ) : null}
              </address>
            ) : (
              <p className="text-sm text-slate-500">No shipping details on file.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4">Summary</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4c9a66]">Subtotal</span>
                <span>{formatCatalogMoney(order.subtotal, order.currency, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c9a66]">Shipping</span>
                <span>{formatCatalogMoney(order.shippingAmount, order.currency, 2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#e7f3eb]">
                <span>Total</span>
                <span>{formatCatalogMoney(order.total, order.currency, 2)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Demo payment from chat — no real card charge.</p>
          </div>

          <div className="rounded-xl border border-[#e7f3eb] bg-[#f8fcf9] p-4 text-center text-sm text-[#0d1b12]">
            Need help? Use{" "}
            <Link href="/help" className="font-bold text-primary hover:underline">
              Help
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
