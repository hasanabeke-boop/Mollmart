'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchBarRow, SearchField } from "@/components/ui/SearchField";
import { requestStatusTone, StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useModalPresence } from "@/hooks/useModalPresence";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import RoleGate from "@/components/auth/RoleGate";
import { canUseBuyerWorkspace } from "@/lib/workspace";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency } from "@/lib/currency";
import { computeOfferLineTotal } from "@/lib/offerPricing";

/** Legacy slug keys from older drafts; DB uses Category.id (cuid). */
const LEGACY_CATEGORY_SLUG_LABELS: Record<string, string> = {
  "home-furniture": "Home & Furniture",
  electronics: "Electronics",
  fashion: "Fashion & Apparel",
  collectibles: "Collectibles",
  services: "Services",
  sustainability: "Sustainability",
};

type ApiCategory = { id: string; name: string; slug: string };

type RequestItem = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: string;
  offerCount?: number;
  createdAt: string;
  deadlineAt?: string | null;
  location?: string | null;
  isNegotiable?: boolean;
  auctionEnabled?: boolean;
};

type OfferItem = {
  id: string;
  requestId: string;
  price: number;
  currency: string;
  message: string;
  status: string;
  sellerId: string;
  seller?: { id: string; name: string };
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
    quantity: Math.max(1, Math.floor(dec(raw.quantity) ?? 1)),
    budgetMin: dec(raw.budgetMin),
    budgetMax: dec(raw.budgetMax),
    currency: normalizeCurrency(raw.currency != null ? String(raw.currency) : DEFAULT_CURRENCY),
    status: String(raw.status ?? ""),
    offerCount: typeof raw.offerCount === "number" ? raw.offerCount : dec(raw.offerCount),
    createdAt: String(raw.createdAt ?? ""),
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    location: raw.location != null ? String(raw.location) : null,
    isNegotiable: typeof raw.isNegotiable === "boolean" ? raw.isNegotiable : Boolean(raw.isNegotiable),
    auctionEnabled:
      typeof raw.auctionEnabled === "boolean" ? raw.auctionEnabled : Boolean(raw.auctionEnabled),
  };
}

function formatBudget(request: RequestItem) {
  const currency = normalizeCurrency(request.currency);
  const fmt = (n: number) => formatMoney(n, currency);
  const qty = Math.max(1, Math.floor(request.quantity ?? 1));
  const unitSuffix = " / unit";

  let price = "Negotiable";
  if (request.budgetMin != null && request.budgetMax != null) {
    price = `${fmt(request.budgetMin)} - ${fmt(request.budgetMax)}${unitSuffix}`;
  } else if (request.budgetMax != null) {
    price = `${fmt(request.budgetMax)}${unitSuffix}`;
  } else if (request.budgetMin != null) {
    price = `${fmt(request.budgetMin)}+${unitSuffix}`;
  }

  return `${qty}× · ${price}`;
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
  const { t } = useLanguage();
  const { activeRole } = useWorkspace();
  const buyerWorkspace = canUseBuyerWorkspace(user, activeRole);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [offersByRequest, setOffersByRequest] = useState<Record<string, OfferItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [acceptingId, setAcceptingId] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<RequestItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [location, setLocation] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [auctionEnabled, setAuctionEnabled] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<
    null | { kind: "delete" | "cancel"; request: RequestItem }
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim() || "";
    setSearch(q);
  }, []);

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
    if (!user || !buyerWorkspace) return;
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
  }, [toast, user, buyerWorkspace]);

  useEffect(() => {
    if (authLoading || !user || !buyerWorkspace) {
      setLoading(false);
      return;
    }
    loadRequests();
  }, [loadRequests, authLoading, user, buyerWorkspace]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCategoriesLoading(true);
      try {
        const rows = await apiFetch<ApiCategory[]>("/api/v1/catalog/categories", { service: "catalog" });
        if (!cancelled) setCatalogCategories(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setCatalogCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openEdit = useCallback((r: RequestItem) => {
    setEditRequest(r);
    setTitle(r.title);
    setDescription(r.description);
    setCategoryId(r.categoryId);
    setQuantity(String(r.quantity != null && r.quantity > 0 ? r.quantity : 1));
    setBudgetMax(r.budgetMax != null ? String(r.budgetMax) : "");
    setDeadlineLocal(toDatetimeLocalValue(r.deadlineAt));
    setLocation(r.location ?? "");
    setIsNegotiable(Boolean(r.isNegotiable));
    setAuctionEnabled(Boolean(r.auctionEnabled));
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
        body.currency = editRequest.currency || DEFAULT_CURRENCY;
        body.isNegotiable = isNegotiable;
        const qty = Math.floor(Number(quantity));
        if (!Number.isFinite(qty) || qty < 1) {
          setSaveError("Quantity must be at least 1.");
          setSaving(false);
          return;
        }
        body.quantity = qty;
        const max = budgetMax.trim() ? Number(budgetMax) : undefined;
        if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
          setSaveError("Enter a valid price per unit.");
          setSaving(false);
          return;
        }
        if (max !== undefined) body.budgetMax = max;
        body.deadlineAt = deadlineLocal ? new Date(deadlineLocal).toISOString() : "";
        body.location = location.trim();
        if (editRequest.status === "draft") {
          body.auctionEnabled = auctionEnabled;
        }
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
    const byId: Record<string, string> = { ...LEGACY_CATEGORY_SLUG_LABELS };
    for (const c of catalogCategories) {
      byId[c.id] = c.name;
      byId[c.slug] = c.name;
    }
    return (id: string) => byId[id] || "Category";
  }, [catalogCategories]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((request) => {
      const haystack = [
        request.title,
        request.description,
        categoryLabel(request.categoryId),
        request.status,
        request.location || "",
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [requests, search, categoryLabel]);

  return (
    <RoleGate
      allowedRoles={["buyer", "admin"]}
      title="Buyer request area"
      description="My Requests is for buyers who publish demand and compare seller offers. Sellers should use the seller dashboard and request board."
      ctaHref="/seller/dashboard"
      ctaLabel="Open seller dashboard"
      unauthenticatedDescription="Log in as a buyer to manage requests and accept offers."
    >
    <main className="app-page app-page-wide flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">My Requests</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">
              Review seller offers and open chats after accepting the right match.
            </p>
          </div>
          <Link
            href="/create-product-request"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:px-5 sm:py-3"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Post Request
          </Link>
        </div>

        <SearchBarRow
          meta={
            !loading && requests.length > 0
              ? `${filteredRequests.length} of ${requests.length} requests`
              : undefined
          }
        >
          <SearchField
            id="my-requests-search"
            value={search}
            onChange={setSearch}
            placeholder="Search title, category, status, location…"
          />
        </SearchBarRow>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-[var(--text-muted)]">inventory_2</span>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No requests yet</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Create a request so sellers can respond with offers.</p>
          <Link
            href="/create-product-request"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Post Request
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-[var(--text-muted)]">search_off</span>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No matching requests</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Try another search or clear the field.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {filteredRequests.map((request) => {
            const offers = offersByRequest[request.id] || [];
            const editable = canEdit(request);
            const cancellable = canCancelRequest(request);
            const draftDeletable = request.status === "draft";
            const busy = actionBusyId === request.id;

            return (
              <article
                key={request.id}
                className="app-card flex h-full min-w-0 flex-col rounded-lg p-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={requestStatusTone(request.status)}>
                        {request.status.replace(/_/g, " ")}
                      </StatusBadge>
                    <span className="text-xs text-[var(--text-muted)]">{categoryLabel(request.categoryId)}</span>
                    {request.location ? (
                      <>
                        <span className="hidden text-[var(--border)] sm:inline">·</span>
                        <span className="w-full text-xs text-[var(--text-muted)] sm:w-auto">{request.location}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--foreground)]">
                      {request.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-muted)]">{request.description}</p>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">
                        {formatBudget(request)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{request.offerCount || 0} offers</p>
                    </div>
                    {editable && (
                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        {request.status === "draft" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void publishDraft(request)}
                            className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {busy ? "…" : "Publish"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(request)}
                          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                        >
                          Edit
                        </button>
                        {draftDeletable && (
                          <button
                            type="button"
                            disabled={busy || confirmDialog != null}
                            onClick={() => setConfirmDialog({ kind: "delete", request })}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                          >
                            {busy ? "…" : "Delete"}
                          </button>
                        )}
                        {!draftDeletable && cancellable && (
                          <button
                            type="button"
                            disabled={busy || confirmDialog != null}
                            onClick={() => setConfirmDialog({ kind: "cancel", request })}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                          >
                            {busy ? "…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-muted)] pt-3">
                  {request.auctionEnabled &&
                    request.status !== "draft" &&
                    !["accepted", "closed", "cancelled"].includes(request.status) && (
                      <Link
                        href={`/auctions/${request.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 sm:flex-none"
                      >
                        <span className="material-symbols-outlined text-base">gavel</span>
                        {t("Auction")}
                      </Link>
                    )}
                  <button
                    type="button"
                    onClick={() => loadOffers(request.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] sm:flex-none"
                  >
                    <span className="material-symbols-outlined text-base">local_offer</span>
                    {offersByRequest[request.id] ? "Refresh" : "Offers"}
                  </button>
                </div>

                {offersByRequest[request.id] && (
                  <div className="mt-3 flex flex-col gap-2">
                    {offers.length === 0 ? (
                      <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
                        No offers yet.
                      </p>
                    ) : (
                      offers.map((offer) => {
                        const qty = Math.max(1, request.quantity ?? 1);
                        const unit = Number(offer.price);
                        const total = computeOfferLineTotal(unit, qty);
                        return (
                          <div
                            key={offer.id}
                            className="flex flex-col gap-2 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-muted)] p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                                {formatMoney(unit, offer.currency)}
                                <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">/ unit</span>
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                Total {formatMoney(total, offer.currency)} · qty {qty}
                              </p>
                              {offer.message ? (
                                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{offer.message}</p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                {offer.seller?.name?.trim() || offer.sellerId}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={acceptingId === offer.id || offer.status === "accepted"}
                              onClick={() => acceptOffer(offer)}
                              className="w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {offer.status === "accepted"
                                ? "Accepted"
                                : acceptingId === offer.id
                                  ? "Accepting…"
                                  : "Accept offer"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </article>
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
                      disabled={categoriesLoading}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
                    >
                      {categoriesLoading ? (
                        <option value={categoryId}>Loading categories…</option>
                      ) : (
                        <>
                          {catalogCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          {categoryId &&
                            !catalogCategories.some((c) => c.id === categoryId) && (
                              <option value={categoryId}>{categoryLabel(categoryId)}</option>
                            )}
                        </>
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Price per unit ({editRequest.currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
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
                {t("Price is negotiable")}
              </label>
              {editRequest?.status === "draft" && (
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={auctionEnabled}
                    onChange={(e) => setAuctionEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    {t("Enable reverse auction after publish")}
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {t("Sellers can join a live price competition. Platform rules apply automatically.")}
                    </span>
                  </span>
                </label>
              )}
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
