'use client';

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatCatalogMoney } from "@/lib/catalog";
import {
  deleteAdminCatalogOrder,
  deleteAdminRequestOrder,
  fetchAdminShopCatalogOrders,
  patchAdminShopCatalogOrder,
} from "@/lib/admin";
import { fetchAdminCatalogOrders, patchAdminCatalogOrder, type ShopOrder } from "@/lib/shop";

const STATUSES: ShopOrder["status"][] = ["processing", "shipped", "delivered", "cancelled"];

type OrderTab = "request_deals" | "catalog_shop";

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<OrderTab>("request_deals");
  const [items, setItems] = useState<ShopOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { status: ShopOrder["status"]; trackingNumber: string; carrier: string }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data =
        tab === "catalog_shop"
          ? await fetchAdminShopCatalogOrders(page, 20)
          : await fetchAdminCatalogOrders(page, 20);
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
  }, [page, tab]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

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
        status: d.status,
        trackingNumber: d.trackingNumber.trim() || null,
        carrier: d.carrier.trim() || null,
      };
      if (tab === "catalog_shop") {
        await patchAdminShopCatalogOrder(orderId, body);
      } else {
        await patchAdminCatalogOrder(orderId, body);
      }
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      if (tab === "catalog_shop") {
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
          Request deals come from paid chats; catalog shop orders come from the showcase cart. Deleting an order removes
          it from history; the related chat or request stays.
        </p>
        <div className="mt-4 flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("request_deals")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === "request_deals" ? "border-red-600 text-red-700" : "border-transparent text-gray-500"
            }`}
          >
            Request deals
          </button>
          <button
            type="button"
            onClick={() => setTab("catalog_shop")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === "catalog_shop" ? "border-red-600 text-red-700" : "border-transparent text-gray-500"
            }`}
          >
            Catalog shop
          </button>
        </div>
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
                  No orders found.
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
                            [o.id]: {
                              ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }),
                              status: e.target.value as ShopOrder["status"],
                            },
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
                            [o.id]: {
                              ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }),
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
                              ...(prev[o.id] ?? { status: o.status, trackingNumber: "", carrier: "" }),
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
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {savingId === o.id ? "…" : "Save"}
                        </button>
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
            ? `Order ${deleteTarget.id} will be permanently removed. The related chat or request is not deleted.`
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
