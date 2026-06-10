'use client';

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import ModalPortal from "@/components/ui/ModalPortal";
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
import {
  approveCancellationRequest,
  fetchAdminCancellationRequests,
  rejectCancellationRequest,
  type OrderCancellationRequest,
} from "@/lib/orderCancellation";
import type { ShopOrder } from "@/lib/shop";
import { useLanguage } from "@/context/LanguageContext";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orderStatus";

type OrderTab = "catalog" | "deals" | "cancellations";
type AnyOrder = ShopOrder | RequestDealOrder;

export default function AdminOrdersPage() {
  const { t } = useLanguage();
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
  const [cancellationItems, setCancellationItems] = useState<OrderCancellationRequest[]>([]);
  const [cancellationMeta, setCancellationMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [cancellationStatus, setCancellationStatus] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [reviewTarget, setReviewTarget] = useState<OrderCancellationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "cancellations") {
        const status = cancellationStatus === "all" ? undefined : cancellationStatus;
        const data = await fetchAdminCancellationRequests(page, 20, status);
        setCancellationItems(data.items ?? []);
        setCancellationMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
        setItems([]);
        return;
      }

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
      setCancellationItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, tab, cancellationStatus]);

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

  const openReview = (item: OrderCancellationRequest, action: "approve" | "reject") => {
    setReviewTarget(item);
    setReviewAction(action);
    setAdminNote("");
  };

  const runReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    setReviewing(true);
    setError("");
    try {
      if (reviewAction === "approve") {
        await approveCancellationRequest(reviewTarget.id, adminNote);
      } else {
        await rejectCancellationRequest(reviewTarget.id, adminNote);
      }
      setReviewTarget(null);
      setReviewAction(null);
      setAdminNote("");
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Review failed");
    } finally {
      setReviewing(false);
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
        <button
          type="button"
          onClick={() => {
            setTab("cancellations");
            setPage(1);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === "cancellations"
              ? "bg-red-600 text-white"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {t("Cancellation requests")}
        </button>
      </div>

      {tab === "cancellations" ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setCancellationStatus(s);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                cancellationStatus === s
                  ? "bg-amber-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? t("All") : t(s === "pending" ? "Pending" : s === "approved" ? "Approved" : "Rejected")}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {tab === "cancellations" ? (
        <div className="overflow-x-auto rounded-xl border border-[#e7f3eb] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("Order")}</th>
                <th className="px-4 py-3">{t("Requested by")}</th>
                <th className="px-4 py-3">{t("Reason")}</th>
                <th className="px-4 py-3">{t("Status")}</th>
                <th className="px-4 py-3 w-40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : cancellationItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t("No cancellation requests found.")}
                  </td>
                </tr>
              ) : (
                cancellationItems.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0d1b12]">{item.order?.title ?? "—"}</p>
                      <p className="font-mono text-[11px] text-gray-500 break-all max-w-[180px] mt-1">
                        {item.orderId}
                      </p>
                      {item.order ? (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCatalogMoney(item.order.total, item.order.currency, 2)} ·{" "}
                          {item.orderKind === "catalog" ? t("Shop order") : t("Request deal")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.requestedBy.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.reason}</p>
                      {item.adminNote ? (
                        <p className="text-xs text-gray-500 mt-2">
                          {t("Admin note")}: {item.adminNote}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase">{t(item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : "Rejected")}</span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "pending" ? (
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReview(item, "approve")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            {t("Approve cancellation")}
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(item, "reject")}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            {t("Reject request")}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
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
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {(tab === "cancellations" ? cancellationMeta : meta).page} /{" "}
          {Math.max(1, tab === "cancellations" ? cancellationMeta.totalPages : meta.totalPages)} ·{" "}
          {tab === "cancellations" ? cancellationMeta.total : meta.total}{" "}
          {tab === "cancellations" ? t("requests") : "orders"}
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
            disabled={page >= (tab === "cancellations" ? cancellationMeta.totalPages : meta.totalPages)}
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

      {reviewTarget != null && reviewAction != null ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => !reviewing && (setReviewTarget(null), setReviewAction(null), setAdminNote(""))}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900">
                {reviewAction === "approve"
                  ? t("Approve cancellation?")
                  : t("Reject cancellation request?")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {reviewAction === "approve"
                  ? t("The order will be cancelled immediately.")
                  : t("The order will stay active. The requester will see your decision.")}
              </p>
              <label className="mt-4 block">
                <span className="text-xs font-medium text-gray-600">{t("Admin note (optional)")}</span>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder={t("Note visible to the requester…")}
                />
              </label>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => {
                    setReviewTarget(null);
                    setReviewAction(null);
                    setAdminNote("");
                  }}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => void runReview()}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                    reviewAction === "approve" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {reviewing
                    ? t("Submitting…")
                    : reviewAction === "approve"
                      ? t("Approve cancellation")
                      : t("Reject request")}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
