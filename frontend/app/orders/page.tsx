'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchMyOrders, type ShopOrder } from "@/lib/shop";

const STATUS_TABS: { id: "all" | ShopOrder["status"]; label: string }[] = [
  { id: "all", label: "All orders" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

function statusBadge(status: ShopOrder["status"]) {
  if (status === "delivered") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <span className="size-1.5 rounded-full bg-green-500" />
        Delivered
      </span>
    );
  }
  if (status === "shipped") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Shipped
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <span className="size-1.5 rounded-full bg-yellow-500" />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      <span className="size-1.5 rounded-full bg-red-500" />
      Cancelled
    </span>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ShopOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const status = activeTab === "all" ? undefined : activeTab;
      const data = await fetchMyOrders(page, PAGE_SIZE, status);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      setError(err.message || "Failed to load orders");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/orders")}`);
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const handleTabChange = (id: (typeof STATUS_TABS)[number]["id"]) => {
    setActiveTab(id);
    setPage(1);
  };

  const totalPages = Math.max(1, meta.totalPages);
  const startIndex = (meta.page - 1) * meta.limit;

  const rows = useMemo(() => {
    return items.map((order) => {
      const thumb = order.lines[0]?.imageUrl ?? "";
      const title =
        order.lines.length === 1
          ? order.lines[0]?.title ?? "Order"
          : `${order.lines[0]?.title ?? "Items"} +${order.lines.length - 1}`;
      return { order, thumb, title };
    });
  }, [items]);

  if (authLoading || (!user && !error)) {
    return <div className="mx-auto max-w-[1280px] px-6 py-16 text-center text-slate-500">Loading…</div>;
  }

  if (!user) return null;

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0d1b12] mb-2 tracking-tight">My orders</h1>
        <p className="text-[#4c9a66]">Catalog purchases — track delivery and order details.</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-[#cfe7d7] mb-6 gap-4">
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 border-b-[3px] text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-[#0d1b12] font-bold"
                  : "border-transparent text-[#4c9a66] hover:text-[#0d1b12]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe7d7] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#4c9a66] uppercase bg-[#f8fcf9] border-b border-[#cfe7d7]">
              <tr>
                <th className="px-6 py-4 font-semibold w-16" scope="col">
                  Item
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Order
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Date
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Total
                </th>
                <th className="px-6 py-4 font-semibold text-right" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfe7d7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                rows.map(({ order, thumb, title }) => (
                  <tr key={order.id} className="bg-white hover:bg-[#f8fcf9] transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="size-12 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-100"
                        style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0d1b12] line-clamp-2">{title}</div>
                      <div className="text-xs text-[#4c9a66] mt-1">
                        Seller: {order.seller.name} ·{" "}
                        <span className="font-mono text-[10px] sm:text-xs">{order.id.slice(0, 12)}…</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#0d1b12] opacity-80">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">{statusBadge(order.status)}</td>
                    <td className="px-6 py-4 font-bold text-[#0d1b12]">
                      {formatCatalogMoney(order.total, order.currency, 2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "shipped" || order.status === "delivered" ? (
                        <Link
                          href={`/orders/${order.id}/tracking`}
                          className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-primary text-[#0d1b12] font-bold text-xs tracking-wide uppercase hover:bg-[#0fd650] transition-colors shadow-sm"
                        >
                          Track
                        </Link>
                      ) : (
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary hover:text-green-600 font-medium text-sm inline-flex items-center gap-1"
                        >
                          Details
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#4c9a66]">
                    No orders yet.{" "}
                    <Link href="/products" className="text-primary font-semibold underline">
                      Shop catalog
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#cfe7d7] px-6 py-4 bg-[#f8fcf9]">
          <div className="text-sm text-[#4c9a66]">
            Page <span className="font-semibold text-[#0d1b12]">{meta.page}</span> of{" "}
            <span className="font-semibold text-[#0d1b12]">{totalPages}</span> ·{" "}
            <span className="font-semibold text-[#0d1b12]">{meta.total}</span> orders
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="flex items-center justify-center size-9 rounded-lg border border-[#cfe7d7] bg-white text-[#0d1b12] hover:bg-[#e7f3eb] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={meta.page >= totalPages}
              className="flex items-center justify-center size-9 rounded-lg border border-[#cfe7d7] bg-white text-[#0d1b12] hover:bg-[#e7f3eb] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
