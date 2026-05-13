'use client';

import { useCallback, useEffect, useState } from "react";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchAdminCatalogOrders, patchAdminCatalogOrder, type ShopOrder } from "@/lib/shop";

const STATUSES: ShopOrder["status"][] = ["processing", "shipped", "delivered", "cancelled"];

export default function AdminCatalogOrdersPage() {
  const [items, setItems] = useState<ShopOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { status: ShopOrder["status"]; trackingNumber: string; carrier: string }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCatalogOrders(page, 20);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
      const next: typeof drafts = {};
      for (const o of data.items ?? []) {
        next[o.id] = {
          status: o.status,
          trackingNumber: o.trackingNumber ?? "",
          carrier: o.carrier ?? "",
        };
      }
      setDrafts(next);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load orders");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (orderId: string) => {
    const d = drafts[orderId];
    if (!d) return;
    setSavingId(orderId);
    setError("");
    try {
      await patchAdminCatalogOrder(orderId, {
        status: d.status,
        trackingNumber: d.trackingNumber.trim() || null,
        carrier: d.carrier.trim() || null,
      });
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0d1b12]">Shop orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update fulfillment status and tracking. Buyers see changes on My orders and Tracking.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[#e7f3eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Buyer / seller</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : (
              items.map((o) => {
                const d = drafts[o.id];
                return (
                  <tr key={o.id} className="align-top hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] text-gray-500 break-all max-w-[140px]">{o.id}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0d1b12]">{o.buyer.name}</p>
                      <p className="text-xs text-gray-500">→ {o.seller.name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {formatCatalogMoney(o.total, o.currency, 2)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full min-w-[120px] rounded border border-gray-200 px-2 py-1 text-xs"
                        value={d?.status ?? o.status}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [o.id]: { ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }), status: e.target.value as ShopOrder["status"] },
                          }))
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full min-w-[100px] rounded border border-gray-200 px-2 py-1 text-xs"
                        placeholder="Tracking #"
                        value={d?.trackingNumber ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [o.id]: { ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }), trackingNumber: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full min-w-[80px] rounded border border-gray-200 px-2 py-1 text-xs"
                        placeholder="Carrier"
                        value={d?.carrier ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [o.id]: { ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }), carrier: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={savingId === o.id}
                        onClick={() => void save(o.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {savingId === o.id ? "…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {meta.page} / {Math.max(1, meta.totalPages)} · {meta.total} orders
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
