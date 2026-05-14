'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiFetchWithRefresh } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useModalPresence } from "@/hooks/useModalPresence";
import { useAuth } from "@/context/AuthContext";
import RoleGate from "@/components/auth/RoleGate";

const CATEGORIES = [
  { value: "home-furniture", label: "Home & Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "collectibles", label: "Collectibles" },
  { value: "services", label: "Services" },
  { value: "sustainability", label: "Sustainability" },
];

type RequestItem = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: string;
  offerCount?: number;
  createdAt: string;
  deadlineAt?: string | null;
  location?: string | null;
  isNegotiable?: boolean;
};

type OfferItem = {
  id: string;
  requestId: string;
  price: number;
  currency: string;
  message: string;
  status: string;
  sellerId: string;
  createdAt: string;
};

function dec(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRequest(raw: Record<string, unknown>): RequestItem {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    categoryId: String(raw.categoryId ?? ""),
    budgetMin: dec(raw.budgetMin),
    budgetMax: dec(raw.budgetMax),
    currency: String(raw.currency ?? "USD"),
    status: String(raw.status ?? ""),
    offerCount: typeof raw.offerCount === "number" ? raw.offerCount : dec(raw.offerCount),
    createdAt: String(raw.createdAt ?? ""),
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    location: raw.location != null ? String(raw.location) : null,
    isNegotiable: typeof raw.isNegotiable === "boolean" ? raw.isNegotiable : Boolean(raw.isNegotiable),
  };
}

function formatBudget(request: RequestItem) {
  const currency = request.currency || "USD";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

  if (request.budgetMin != null && request.budgetMax != null) return `${fmt(request.budgetMin)} - ${fmt(request.budgetMax)}`;
  if (request.budgetMax != null) return fmt(request.budgetMax);
  if (request.budgetMin != null) return `${fmt(request.budgetMin)}+`;
  return "Negotiable";
}

function toDatetimeLocalValue(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Matches backend assertPublishedRequestUpdateAllowed trigger. */
function isRestrictedEdit(request: RequestItem): boolean {
  if (request.status === "draft") return false;
  return (
    (request.offerCount ?? 0) > 0 ||
    request.status === "has_offers"
  );
}

function canEdit(request: RequestItem): boolean {
  return !["accepted", "closed", "cancelled"].includes(request.status);
}

function canCancelRequest(request: RequestItem): boolean {
  return ["draft", "published", "has_offers", "in_negotiation"].includes(request.status);
}

export default function MyRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [offersByRequest, setOffersByRequest] = useState<Record<string, OfferItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<RequestItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [location, setLocation] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<
    null | { kind: "delete" | "cancel"; request: RequestItem }
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const restricted = editRequest ? isRestrictedEdit(editRequest) : false;

  const editModalOpen = Boolean(editOpen && editRequest);
  const { mounted: editModalMounted, visible: editModalVisible } =
    useModalPresence(editModalOpen);

  useEffect(() => {
    if (!editModalMounted) {
      setEditRequest(null);
      setSaveError("");
    }
  }, [editModalMounted]);

  const loadRequests = useCallback(async () => {
    if (!user || (user.role !== "buyer" && user.role !== "admin")) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchWithRefresh<
        { items?: Record<string, unknown>[]; data?: Record<string, unknown>[] } | Record<string, unknown>[]
      >("/api/v1/requests/me?limit=50", { service: "request" });

      const rawList = Array.isArray(data)
        ? data
        : (data.items || data.data || []);
      setRequests(rawList.map((r) => normalizeRequest(r as Record<string, unknown>)));
    } catch (err: unknown) {
      const msg = (err as Error).message || "Failed to load requests.";
      setError(msg);
      toast.error(msg);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (authLoading || !user || (user.role !== "buyer" && user.role !== "admin")) {
      setLoading(false);
      return;
    }
    loadRequests();
  }, [loadRequests, authLoading, user]);

  const openEdit = useCallback((r: RequestItem) => {
    setEditRequest(r);
    setTitle(r.title);
    setDescription(r.description);
    setCategoryId(r.categoryId);
    setBudgetMax(r.budgetMax != null ? String(r.budgetMax) : "");
    setDeadlineLocal(toDatetimeLocalValue(r.deadlineAt));
    setLocation(r.location ?? "");
    setIsNegotiable(Boolean(r.isNegotiable));
    setSaveError("");
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
  }, []);

  const submitEdit = async () => {
    if (!editRequest) return;
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, unknown> = {};
      if (restricted) {
        body.deadlineAt = deadlineLocal ? new Date(deadlineLocal).toISOString() : "";
        body.location = location.trim();
        body.isNegotiable = isNegotiable;
      } else {
        const t = title.trim();
        const d = description.trim();
        if (t.length < 3) {
          setSaveError("Title must be at least 3 characters.");
          setSaving(false);
          return;
        }
        if (d.length < 10) {
          setSaveError("Description must be at least 10 characters.");
          setSaving(false);
          return;
        }
        body.title = t;
        body.description = d;
        body.categoryId = categoryId;
        body.currency = editRequest.currency || "USD";
        body.isNegotiable = isNegotiable;
        const max = budgetMax.trim() ? Number(budgetMax) : undefined;
        if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
          setSaveError("Enter a valid budget.");
          setSaving(false);
          return;
        }
        if (max !== undefined) body.budgetMax = max;
        body.deadlineAt = deadlineLocal ? new Date(deadlineLocal).toISOString() : "";
        body.location = location.trim();
      }

      await apiFetchWithRefresh(`/api/v1/requests/${editRequest.id}`, {
        method: "PATCH",
        service: "request",
        body: JSON.stringify(body),
      });

      setOffersByRequest((prev) => {
        const next = { ...prev };
        delete next[editRequest.id];
        return next;
      });
      closeEdit();
      await loadRequests();
      toast.success("Changes saved.");
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not save changes.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmDialog) return;
    const { kind, request } = confirmDialog;
    setConfirmLoading(true);
    setActionBusyId(request.id);
    setError("");
    try {
      if (kind === "delete") {
        await apiFetchWithRefresh(`/api/v1/requests/${request.id}`, {
          method: "DELETE",
          service: "request",
        });
        toast.success("Draft deleted permanently.");
      } else {
        await apiFetchWithRefresh(`/api/v1/requests/${request.id}/cancel`, {
          method: "POST",
          service: "request",
        });
        toast.success("Request cancelled. Sellers no longer see it as active.");
      }
      setOffersByRequest((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
      setConfirmDialog(null);
      await loadRequests();
    } catch (err: unknown) {
      const msg =
        (err as Error).message ||
        (kind === "delete" ? "Failed to delete draft." : "Failed to cancel request.");
      setError(msg);
      toast.error(msg);
    } finally {
      setConfirmLoading(false);
      setActionBusyId("");
    }
  };

  const publishDraft = async (r: RequestItem) => {
    if (r.status !== "draft") return;
    setActionBusyId(r.id);
    setError("");
    try {
      await apiFetchWithRefresh(`/api/v1/requests/${r.id}/publish`, {
        method: "POST",
        service: "request",
      });
      await loadRequests();
      toast.success("Request published. Sellers can now send offers.");
    } catch (err: unknown) {
      const msg =
        (err as Error).message ||
        "Could not publish. Check deadline and required fields.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionBusyId("");
    }
  };

  const loadOffers = async (requestId: string) => {
    if (offersByRequest[requestId]) return;
    try {
      const data = await apiFetchWithRefresh<{ items?: OfferItem[]; data?: OfferItem[] }>(
        `/api/v1/offers/request/${requestId}`,
        { service: "offer" },
      );
      setOffersByRequest((prev) => ({
        ...prev,
        [requestId]: data.items || data.data || (Array.isArray(data) ? data : []),
      }));
    } catch (err: unknown) {
      const msg = (err as Error).message || "Failed to load offers.";
      setError(msg);
      toast.error(msg);
    }
  };

  const acceptOffer = async (offer: OfferItem) => {
    setAcceptingId(offer.id);
    setError("");
    try {
      await apiFetchWithRefresh(`/api/v1/offers/${offer.id}/accept`, {
        method: "POST",
        service: "offer",
      });
      await apiFetchWithRefresh("/api/v1/conversations", {
        method: "POST",
        service: "chat",
        body: JSON.stringify({ requestId: offer.requestId, offerId: offer.id }),
      });
      toast.success("Offer accepted. Opening chat…");
      router.push("/chat");
    } catch (err: unknown) {
      const msg = (err as Error).message || "Failed to accept offer.";
      setError(msg);
      toast.error(msg);
    } finally {
      setAcceptingId("");
    }
  };

  const categoryLabel = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
    return (id: string) => map[id] || id;
  }, []);

  return (
    <RoleGate
      allowedRoles={["buyer", "admin"]}
      title="Buyer request area"
      description="My Requests is for buyers who publish demand and compare seller offers. Sellers should use the seller dashboard and request board."
      ctaHref="/seller/dashboard"
      ctaLabel="Open seller dashboard"
      unauthenticatedDescription="Log in as a buyer to manage requests and accept offers."
    >
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Requests</h1>
          <p className="mt-1 text-slate-500">Review seller offers and open chats after accepting the right match.</p>
        </div>
        <Link
          href="/create-product-request"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#607afb] px-5 py-3 text-sm font-bold text-white"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Post Request
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">No requests yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create a request so sellers can respond with offers.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const offers = offersByRequest[request.id] || [];
            const editable = canEdit(request);
            const cancellable = canCancelRequest(request);
            const draftDeletable = request.status === "draft";
            const busy = actionBusyId === request.id;

            return (
              <section key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-500">
                        {request.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{categoryLabel(request.categoryId)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{request.title}</h2>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-500">{request.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 md:items-end">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold uppercase text-slate-400">Budget</p>
                      <p className="text-lg font-black text-slate-900">{formatBudget(request)}</p>
                      <p className="mt-1 text-xs text-slate-400">{request.offerCount || 0} offers</p>
                    </div>
                    {editable && (
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {request.status === "draft" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void publishDraft(request)}
                            className="rounded-lg bg-[#607afb] px-3 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                          >
                            {busy ? "…" : "Publish"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(request)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {draftDeletable && (
                          <button
                            type="button"
                            disabled={busy || confirmDialog != null}
                            onClick={() =>
                              setConfirmDialog({ kind: "delete", request })
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {busy ? "…" : "Delete draft"}
                          </button>
                        )}
                        {!draftDeletable && cancellable && (
                          <button
                            type="button"
                            disabled={busy || confirmDialog != null}
                            onClick={() =>
                              setConfirmDialog({ kind: "cancel", request })
                            }
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                          >
                            {busy ? "…" : "Cancel request"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => loadOffers(request.id)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {offersByRequest[request.id] ? "Refresh offers" : "View offers"}
                  </button>
                </div>

                {offersByRequest[request.id] && (
                  <div className="mt-4 space-y-3">
                    {offers.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No offers for this request yet.</p>
                    ) : offers.map((offer) => (
                      <div key={offer.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-black text-slate-900">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: offer.currency }).format(offer.price)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{offer.message}</p>
                            <p className="mt-2 text-xs text-slate-400">Seller: {offer.sellerId}</p>
                          </div>
                          <button
                            type="button"
                            disabled={acceptingId === offer.id || offer.status === "accepted"}
                            onClick={() => acceptOffer(offer)}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-[#0d1b12] disabled:opacity-50"
                          >
                            {offer.status === "accepted" ? "Accepted" : acceptingId === offer.id ? "Accepting..." : "Accept Offer"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {editModalMounted && editRequest && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${
              editModalVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close dialog"
            onClick={closeEdit}
          />
          <div
            className={`relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              editModalVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-3 scale-[0.97] opacity-0"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900">Edit request</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {restricted && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                This request already has offers. You can only update deadline, location, and negotiable flag.
              </p>
            )}

            <div className="space-y-4">
              {!restricted && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">Budget max ({editRequest.currency})</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  value={deadlineLocal}
                  onChange={(e) => setDeadlineLocal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">Location (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="City or region"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Price is negotiable
              </label>
            </div>

            {saveError && (
              <p className="mt-4 text-sm text-red-600">{saveError}</p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitEdit()}
                className="rounded-xl bg-[#607afb] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDialog != null}
        title={
          confirmDialog?.kind === "delete"
            ? "Delete this draft?"
            : "Cancel this request?"
        }
        description={
          confirmDialog
            ? confirmDialog.kind === "delete"
              ? `This will permanently remove “${confirmDialog.request.title}”. You can’t undo this.`
              : `“${confirmDialog.request.title}” will be withdrawn. Sellers will no longer see it as an active listing.`
            : ""
        }
        confirmLabel={
          confirmDialog?.kind === "delete" ? "Delete draft" : "Cancel request"
        }
        variant={confirmDialog?.kind === "delete" ? "danger" : "warning"}
        loading={confirmLoading}
        onClose={() => {
          if (!confirmLoading) setConfirmDialog(null);
        }}
        onConfirm={runConfirmedAction}
      />
    </main>
    </RoleGate>
  );
}
