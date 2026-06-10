'use client';

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatCatalogMoney } from "@/lib/catalog";
import {
  deleteAdminCatalogOrder,
  deleteAdminRequestOrder,
  fetchAdminCatalogOrders,
  patchAdminCatalogOrder,
} from "@/lib/admin";
import {
  fetchAdminRequestDealOrders,
  patchAdminRequestDealOrder,
  type RequestDealOrder,
} from "@/lib/requestDeals";
import type { ShopOrder } from "@/lib/shop";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orderStatus";

type OrderTab = "catalog" | "deals";
type AnyOrder = ShopOrder | RequestDealOrder;

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<OrderTab>("catalog");
  const [items, setItems] = useState<AnyOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnyOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { trackingNumber: string; carrier: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data =
        tab === "catalog"
          ? await fetchAdminCatalogOrders(page, 20)
          : await fetchAdminRequestDealOrders(page, 20);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
      const next: typeof drafts = {};
      for (const o of data.items ?? []) {
        next[o.id] = {
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
  }, [page, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (orderId: string) => {
    const d = drafts[orderId];
    if (!d) return;
    setSavingId(orderId);
    setError("");
    try {
      const body = {
        trackingNumber: d.trackingNumber.trim() || null,
        carrier: d.carrier.trim() || null,
      };
      if (tab === "catalog") {
        await patchAdminCatalogOrder(orderId, body);
      } else {
        await patchAdminRequestDealOrder(orderId, body);
      }
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const cancelOrder = async (order: AnyOrder) => {
    if (order.status === "cancelled" || order.status === "completed") return;
    setSavingId(order.id);
    setError("");
    try {
      if (tab === "catalog") {
        await patchAdminCatalogOrder(order.id, { status: "cancelled" });
      } else {
        await patchAdminRequestDealOrder(order.id, { status: "cancelled" });
      }
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Cancel failed");
    } finally {
      setSavingId(null);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      if (tab === "catalog") {
        await deleteAdminCatalogOrder(deleteTarget.id);
      } else {
        await deleteAdminRequestOrder(deleteTarget.id);
      }
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0d1b12]">Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Shop checkout orders and request-deal orders. Admins can cancel open orders or edit tracking details.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("catalog");
            setPage(1);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === "catalog"
              ? "bg-red-600 text-white"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Shop orders
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("deals");
            setPage(1);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === "deals"
              ? "bg-red-600 text-white"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Request deals
        </button>
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
              <th className="px-4 py-3 w-36" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No {tab === "catalog" ? "shop" : "request deal"} orders found.
                </td>
              </tr>
            ) : (
              items.map((o) => {
                const d = drafts[o.id];
                return (
                  <tr key={o.id} className="align-top hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] text-gray-500 break-all max-w-[140px]">{o.id}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                      {tab === "catalog" && o.lines.length > 0 ? (
                        <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[160px]">
                          {o.lines[0].title}
                          {o.lines.length > 1 ? ` +${o.lines.length - 1}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0d1b12]">{o.buyer.name}</p>
                      <p className="text-xs text-gray-500">→ {o.seller.name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {formatCatalogMoney(o.total, o.currency, 2)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-[#0d1b12]">
                        {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{o.status}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full min-w-[100px] rounded border border-gray-200 px-2 py-1 text-xs"
                        placeholder="Tracking #"
                        value={d?.trackingNumber ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [o.id]: {
                              ...(prev[o.id] ?? { trackingNumber: "", carrier: "" }),
                              trackingNumber: e.target.value,
                            },
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
                            [o.id]: {
                              ...(prev[o.id] ?? { trackingNumber: "", carrier: "" }),
                              carrier: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={savingId === o.id}
                          onClick={() => void save(o.id)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-[#0d1b12] hover:opacity-90 disabled:opacity-50"
                        >
                          {savingId === o.id ? "…" : "Save tracking"}
                        </button>
                        {o.status !== "cancelled" && o.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={savingId === o.id}
                            onClick={() => void cancelOrder(o)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancel order
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(o)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
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

      <ConfirmModal
        open={deleteTarget != null}
        title="Delete this order?"
        description={
          deleteTarget
            ? `Order ${deleteTarget.id} will be permanently removed. Related chat or request data is not deleted.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={runDelete}
      />
    </div>
  );
}
