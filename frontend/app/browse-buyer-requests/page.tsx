'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { firstAttachmentImageUrl } from "@/lib/requestMedia";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { translateCategoryName } from "@/lib/categoryI18n";
import { useWorkspace } from "@/context/WorkspaceContext";
import RoleGate from "@/components/auth/RoleGate";
import { canUseSellerWorkspace } from "@/lib/workspace";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency } from "@/lib/currency";
import { computeOfferLineTotal } from "@/lib/offerPricing";
import AuctionJoinModal from "@/components/auction/AuctionJoinModal";
import ModalPortal from "@/components/ui/ModalPortal";
import { SearchField } from "@/components/ui/SearchField";
import RequestCoverImage from "@/components/request/RequestCoverImage";

type ApiCategory = { id: string; name: string; slug: string };

type BuyerRequest = {
  id: string;
  title: string;
  categoryId: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  budget: string;
  quantity: number;
  budgetMax: number;
  currency: string;
  description: string;
  postedAgo: string;
  offerCount: number;
  status: string;
  urgent?: boolean;
  image?: string;
  isNegotiable?: boolean;
  auctionEnabled?: boolean;
};

const CATEGORY_STYLES: Record<string, { icon: string; iconBg: string; iconColor: string; barColor: string }> = {
  electronics: {
    icon: "computer",
    iconBg: "bg-gradient-to-br from-blue-100 to-sky-100",
    iconColor: "text-blue-700",
    barColor: "bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400",
  },
  home: {
    icon: "home",
    iconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
    iconColor: "text-amber-800",
    barColor: "bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400",
  },
  "home-furniture": {
    icon: "chair",
    iconBg: "bg-gradient-to-br from-orange-100 to-amber-100",
    iconColor: "text-orange-700",
    barColor: "bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400",
  },
  sustainability: {
    icon: "eco",
    iconBg: "bg-gradient-to-br from-emerald-100 to-teal-100",
    iconColor: "text-emerald-700",
    barColor: "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400",
  },
  collectibles: {
    icon: "watch",
    iconBg: "bg-gradient-to-br from-purple-100 to-violet-100",
    iconColor: "text-purple-700",
    barColor: "bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400",
  },
  fashion: {
    icon: "shopping_bag",
    iconBg: "bg-gradient-to-br from-rose-100 to-pink-100",
    iconColor: "text-rose-700",
    barColor: "bg-gradient-to-r from-rose-600 via-pink-500 to-fuchsia-400",
  },
  services: {
    icon: "design_services",
    iconBg: "bg-gradient-to-br from-cyan-100 to-blue-100",
    iconColor: "text-cyan-700",
    barColor: "bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500",
  },
  other: {
    icon: "more_horiz",
    iconBg: "bg-gradient-to-br from-slate-100 to-gray-100",
    iconColor: "text-slate-700",
    barColor: "bg-gradient-to-r from-slate-600 via-gray-500 to-zinc-400",
  },
};

const ORPHAN_CATEGORY_STYLES: { icon: string; iconBg: string; iconColor: string; barColor: string }[] = [
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-violet-100 to-purple-100",
    iconColor: "text-violet-700",
    barColor: "bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500",
  },
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-sky-100 to-indigo-100",
    iconColor: "text-sky-700",
    barColor: "bg-gradient-to-r from-sky-600 via-indigo-500 to-violet-500",
  },
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
    iconColor: "text-amber-800",
    barColor: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500",
  },
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-teal-100 to-emerald-100",
    iconColor: "text-teal-700",
    barColor: "bg-gradient-to-r from-teal-600 via-emerald-500 to-lime-400",
  },
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-fuchsia-100 to-pink-100",
    iconColor: "text-fuchsia-700",
    barColor: "bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-400",
  },
  {
    icon: "category",
    iconBg: "bg-gradient-to-br from-indigo-100 to-blue-100",
    iconColor: "text-indigo-700",
    barColor: "bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400",
  },
];

function hashStringToIndex(s: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? h % modulo : 0;
}

function resolveCategoryVisualStyle(list: ApiCategory[], categoryId: string) {
  const slugKey = styleSlugForCategory(list, categoryId);
  const known = CATEGORY_STYLES[slugKey];
  if (known != null) return known;
  const idx = hashStringToIndex(categoryId, ORPHAN_CATEGORY_STYLES.length);
  return ORPHAN_CATEGORY_STYLES[idx]!;
}

function lookupCategory(list: ApiCategory[], categoryId: string): ApiCategory | undefined {
  const t = categoryId.trim();
  if (!t) return undefined;
  return list.find((c) => c.id === t || c.slug === t);
}

function styleSlugForCategory(list: ApiCategory[], categoryId: string): string {
  return lookupCategory(list, categoryId)?.slug ?? categoryId;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days}d ago`;
}

function formatBudget(
  min?: unknown,
  max?: unknown,
  currency?: string,
  quantity?: unknown,
): string {
  const cur = normalizeCurrency(currency);
  const toNum = (v: unknown): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined;
  };
  const minN = toNum(min);
  const maxN = toNum(max);
  const qty = Math.floor(toNum(quantity) ?? 1);
  const unitSuffix = " / unit";
  let price = "Negotiable";
  if (minN != null && maxN != null) {
    price = `${formatMoney(minN, cur)} – ${formatMoney(maxN, cur)}${unitSuffix}`;
  } else if (maxN != null) {
    price = `${formatMoney(maxN, cur)}${unitSuffix}`;
  } else if (minN != null) {
    price = `${formatMoney(minN, cur)}+${unitSuffix}`;
  }
  return `${qty}× · ${price}`;
}

function formatQuantityLabel(quantity?: unknown): string {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  return qty === 1 ? "1 item" : `${qty} items`;
}

/** Width % for budget bar vs max budget on the current board (same list). */
function budgetBarWidthPercent(amount: number, listMax: number): number {
  if (amount <= 0 || listMax <= 0) return 0;
  const pct = (amount / listMax) * 100;
  return Math.min(100, Math.max(4, Math.round(pct)));
}

function parseOptionalMoney(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined;
}

type FilterTab = "recommendations" | "all" | "has_offers";

const SELLER_REC_HINT =
  "To see recommended buyer requests, publish catalog products in your categories or choose selling preferences in your profile settings.";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "recommendations", label: "Recommendations" },
  { id: "all", label: "All Requests" },
  { id: "has_offers", label: "Has Offers" },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function OfferModal({
  request,
  onClose,
}: {
  request: BuyerRequest;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState("");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const [sending, setSending] = useState(false);
  const qty = Math.max(1, Math.floor(request.quantity) || 1);
  const unitNum = Number(price);
  const lineTotal =
    price && Number.isFinite(unitNum) && unitNum > 0
      ? computeOfferLineTotal(unitNum, qty)
      : null;

  const handleSend = async () => {
    const num = Number(price);
    if (!price || Number.isNaN(num) || num <= 0) return;
    if (message.trim().length < 5) {
      setSendError("Message must be at least 5 characters.");
      return;
    }

    setSending(true);
    setSendError("");
    try {
      await apiFetchWithRefresh("/api/v1/offers", {
        method: "POST",
        service: "offer",
        body: JSON.stringify({
          requestId: request.id,
          price: num,
          currency: DEFAULT_CURRENCY,
          message: message.trim(),
          deliveryDays: delivery ? parseInt(delivery, 10) || undefined : undefined,
        }),
      });
      setSent(true);
    } catch (err: unknown) {
      const e = err as Error;
      setSendError(e.message || "Failed to send offer.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
        onClick={onClose}
        data-no-translate
      >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[scale-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Make an Offer</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">
                check_circle
              </span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              Offer Sent!
            </h4>
            <p className="text-slate-500 text-sm mb-2">
              Your offer:{" "}
              <span className="font-bold text-slate-900">
                {formatMoney(Number(price), DEFAULT_CURRENCY)}
              </span>{" "}
              per unit × {qty} ={" "}
              <span className="font-bold text-slate-900">
                {formatMoney(computeOfferLineTotal(Number(price), qty), DEFAULT_CURRENCY)}
              </span>{" "}
              total for
            </p>
            <p className="font-semibold text-slate-800 mb-4">
              &ldquo;{request.title}&rdquo;
            </p>
            <p className="text-xs text-slate-400 mb-6">
              The buyer will be notified and can accept or decline your offer.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#607afb] text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                Request
              </p>
              <p className="font-bold text-slate-900">{request.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                Buyer budget: {request.budget}
              </p>
              <p className="text-sm text-slate-500 mt-1">Quantity: {qty}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Your price per unit (₸)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min={0}
                step={0.01}
                autoFocus
              />
              {lineTotal != null && lineTotal > 0 && (
                <p className="text-sm font-semibold text-slate-800">
                  Order total: {formatMoney(lineTotal, DEFAULT_CURRENCY)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Estimated availability
              </label>
              <div className="relative">
                <select
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-slate-900"
                >
                  <option value="">Select timeframe</option>
                  <option value="3">Within 3 days</option>
                  <option value="7">Within 7 days</option>
                  <option value="14">Within 2 weeks</option>
                  <option value="28">Within 4 weeks</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Message to Buyer{" "}
                <span className="text-slate-400 font-normal">(required)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                placeholder="Describe why you're the right seller, your experience, etc."
              />
            </div>

            {sendError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {sendError}
              </div>
            )}

              <button
                type="button"
                onClick={handleSend}
                disabled={!price || Number(price) <= 0 || message.trim().length < 5 || sending}
                className="w-full bg-[#607afb] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">
                  send
                </span>
                {sending ? "Sending..." : "Send Offer"}
              </button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}

export default function BrowseBuyerRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { activeRole } = useWorkspace();
  const sellerWorkspace = canUseSellerWorkspace(user, activeRole);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [offerTarget, setOfferTarget] = useState<BuyerRequest | null>(null);
  const [auctionTarget, setAuctionTarget] = useState<BuyerRequest | null>(null);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hasRecommendationSignals, setHasRecommendationSignals] = useState<boolean | null>(null);
  const [catalogCategories, setCatalogCategories] = useState<ApiCategory[]>([]);
  const userId = user?.id ?? null;

  const categoryLabel = useCallback(
    (categoryId: string) => {
      const row = lookupCategory(catalogCategories, categoryId);
      return translateCategoryName(
        row?.name?.trim() || categoryId.trim() || "Uncategorized",
        language,
        row?.slug,
      );
    },
    [catalogCategories, language],
  );

  const loadRequests = useCallback(async () => {
    if (!userId || !sellerWorkspace) return;
    setLoadingData(true);
    setRequests([]);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (activeTab === "recommendations") {
        params.set("recommended", "true");
      } else {
        setHasRecommendationSignals(null);
      }
      if (debouncedSearch.trim().length >= 2) params.set("q", debouncedSearch.trim());
      if (selectedCategory) params.set("categoryId", selectedCategory);

      const data = await apiFetchWithRefresh<{
        data?: Array<{
          id: string;
          title: string;
          description: string;
          categoryId: string;
          budgetMin?: number | string;
          budgetMax?: number | string;
          currency?: string;
          status: string;
          offerCount?: number;
          createdAt: string;
          isNegotiable?: boolean;
          auctionEnabled?: boolean;
          attachments?: Array<{ fileUrl?: string } | string>;
        }>;
        items?: Array<{
          id: string;
          title: string;
          description: string;
          categoryId: string;
          budgetMin?: number | string;
          budgetMax?: number | string;
          currency?: string;
          status: string;
          offerCount?: number;
          createdAt: string;
          isNegotiable?: boolean;
          auctionEnabled?: boolean;
          attachments?: Array<{ fileUrl?: string } | string>;
        }>;
        hasRecommendationSignals?: boolean;
      }>(`/api/v1/requests?${params.toString()}`, { service: "request" });

      if (activeTab === "recommendations") {
        setHasRecommendationSignals(data.hasRecommendationSignals ?? false);
      }

      const items = data.data || data.items || (Array.isArray(data) ? data : []);

      const mapped: BuyerRequest[] = (items as Array<{
        id: string;
        title: string;
        description: string;
        categoryId: string;
        budgetMin?: number | string;
        budgetMax?: number | string;
        quantity?: number | string;
        currency?: string;
        status: string;
        offerCount?: number;
        createdAt: string;
        isNegotiable?: boolean;
        auctionEnabled?: boolean;
        attachments?: Array<{ fileUrl?: string } | string>;
      }>).map((r) => {
        const style = resolveCategoryVisualStyle(catalogCategories, r.categoryId);
        const maxVal = parseOptionalMoney(r.budgetMax) ?? parseOptionalMoney(r.budgetMin) ?? 0;
        return {
          id: r.id,
          title: r.title,
          categoryId: r.categoryId,
          ...style,
          budget: formatBudget(r.budgetMin, r.budgetMax, r.currency, r.quantity),
          quantity: Math.max(1, Math.floor(Number(r.quantity) || 1)),
          budgetMax: maxVal,
          currency: normalizeCurrency(r.currency),
          description: r.description,
          postedAgo: timeAgo(r.createdAt),
          offerCount: r.offerCount || 0,
          status: r.status,
          isNegotiable: Boolean(r.isNegotiable),
          auctionEnabled: Boolean(r.auctionEnabled),
          image: firstAttachmentImageUrl(r.attachments),
        };
      });

      setRequests(mapped);
    } catch {
      setRequests([]);
      if (activeTab === "recommendations") setHasRecommendationSignals(null);
    } finally {
      setLoadingData(false);
    }
  }, [activeTab, debouncedSearch, selectedCategory, userId, sellerWorkspace, catalogCategories]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");
    const rawCat = params.get("category")?.trim() || "";
    (async () => {
      try {
        const rows = await apiFetch<ApiCategory[]>("/api/v1/catalog/categories", { service: "catalog" });
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setCatalogCategories(list);
        if (rawCat) {
          const byId = list.find((c) => c.id === rawCat);
          const bySlug = list.find((c) => c.slug === rawCat);
          setSelectedCategory(byId?.id ?? bySlug?.id ?? rawCat);
        }
      } catch {
        if (!cancelled) {
          setCatalogCategories([]);
          if (rawCat) setSelectedCategory(rawCat);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !userId || !sellerWorkspace) {
      setLoadingData(false);
      return;
    }
    loadRequests();
  }, [loadRequests, authLoading, userId, sellerWorkspace]);

  const filteredRequests = useMemo(() => {
    let data = requests;

    if (activeTab === "has_offers") {
      data = data.filter((r) => r.status === "has_offers");
    }

    if (selectedCategory) {
      data = data.filter((r) => r.categoryId === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          categoryLabel(r.categoryId).toLowerCase().includes(q) ||
          r.categoryId.toLowerCase().includes(q),
      );
    }

    return data;
  }, [requests, search, selectedCategory, activeTab, categoryLabel]);

  const featuredRequest = filteredRequests.find((r) => r.image);
  const regularRequests = filteredRequests.filter((r) => r !== featuredRequest);

  const categoryFilterOptions = useMemo(() => {
    const ids = [...new Set(requests.map((r) => r.categoryId))].filter(Boolean);
    return ids
      .map((id) => ({
        id,
        name: categoryLabel(id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests, catalogCategories, categoryLabel]);

  const boardBudgetMax = useMemo(() => {
    const nums = filteredRequests.map((r) => r.budgetMax).filter((n) => n > 0);
    return nums.length > 0 ? Math.max(...nums) : 0;
  }, [filteredRequests]);

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title="Seller request board"
      description="This board is for sellers to find buyer requests and submit offers. Buyers manage their own requests from My Requests."
      ctaHref="/my-requests"
      ctaLabel="Open my requests"
      unauthenticatedDescription="Log in as a seller to browse buyer requests and submit offers."
    >
    <div className="app-page app-page-wide">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            Buyer Requests
          </h1>
          <p className="text-[var(--text-muted)]">
            Find your next customer by browsing active buyer requests.
          </p>
        </div>
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          Seller Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search requests by title, description, or category…"
          width="wide"
        />
      </div>

      {/* Filter Tabs + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0 overflow-x-auto pb-1">
        <div className="inline-flex min-w-min p-1 rounded-xl bg-[var(--surface-muted)]">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors ${
              showFilters || selectedCategory
                ? "border-blue-400 text-blue-600"
                : "border-slate-200 text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            <span>Filters</span>
            {selectedCategory && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {categoryFilterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === opt.id ? "" : opt.id)
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === opt.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.name}
            </button>
          ))}
          {selectedCategory && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setShowFilters(false);
              }}
              className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        Showing{" "}
        <span className="font-bold text-slate-900">
          {filteredRequests.length}
        </span>{" "}
        request{filteredRequests.length !== 1 ? "s" : ""}
      </p>

      {loadingData ? (
        <div className="rounded-2xl border border-[#dfe7f2] bg-white p-6 text-center text-sm font-semibold text-slate-500">
          Loading live requests...
        </div>
      ) : activeTab === "recommendations" && hasRecommendationSignals === false ? (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-700 text-3xl">tune</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No recommendation data yet</h3>
          <p className="text-slate-600 text-sm mb-4">{SELLER_REC_HINT}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
            <Link href="/seller/products/new" className="text-blue-600 hover:underline">
              Add a product listing
            </Link>
            <Link href="/profile" className="text-blue-600 hover:underline">
              Profile settings
            </Link>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-slate-400 text-3xl">
              search_off
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No requests found
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Try adjusting your search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
              setActiveTab("recommendations");
            }}
            className="text-sm text-blue-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Card (first request with image) */}
          {featuredRequest && (
            <div className="lg:col-span-2 app-card flex flex-col overflow-hidden rounded-xl md:flex-row">
              <div className="relative p-4 pb-0 md:p-4 md:pr-0">
                <RequestCoverImage
                  variant="featured"
                  src={featuredRequest.image}
                  alt={featuredRequest.title}
                />
                {featuredRequest.urgent && (
                  <div className="absolute top-6 left-6 md:top-6 md:left-6">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Urgent Request
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-6 lg:p-8">
                <div>
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">
                        Category: {categoryLabel(featuredRequest.categoryId)}
                      </span>
                      <h3 className="text-2xl font-bold leading-tight">
                        {featuredRequest.title}
                      </h3>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-sm text-slate-400 mb-1">
                        Quantity: {formatQuantityLabel(featuredRequest.quantity)}
                      </p>
                      <p className="text-xs text-slate-400 mb-1">Price (per unit)</p>
                      <p className="text-xl font-black text-slate-900">
                        {featuredRequest.budget}
                      </p>
                      {featuredRequest.isNegotiable ? (
                        <p className="text-xs text-slate-400 mt-1">Open to other amounts</p>
                      ) : null}
                      {boardBudgetMax > 0 && featuredRequest.budgetMax > 0 ? (
                        <div className="mt-3 w-full max-w-[220px] ml-auto h-2 rounded-full overflow-hidden bg-gradient-to-r from-violet-100/90 via-indigo-50 to-cyan-100/90 ring-1 ring-inset ring-black/[0.04]">
                          <div
                            className={`h-full rounded-full ${featuredRequest.barColor}`}
                            style={{
                              width: `${budgetBarWidthPercent(featuredRequest.budgetMax, boardBudgetMax)}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mb-6">
                    {featuredRequest.description}
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-sm">
                        calendar_today
                      </span>
                      <span className="text-sm text-slate-500">
                        {featuredRequest.postedAgo}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <span className="material-symbols-outlined text-sm">
                        group
                      </span>
                      {featuredRequest.offerCount} Offers
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => setOfferTarget(featuredRequest)}
                      className="w-full rounded-xl bg-[#607afb] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto sm:px-8"
                    >
                      Make an Offer
                    </button>
                    {featuredRequest.auctionEnabled && (
                      <button
                        type="button"
                        onClick={() => setAuctionTarget(featuredRequest)}
                        className="w-full rounded-xl border-2 border-[#607afb] px-6 py-3 font-bold text-[#607afb] transition-all hover:bg-[#607afb]/5 sm:w-auto sm:px-8"
                      >
                        {t("Join auction")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Cards */}
          {regularRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <RequestCoverImage
                  className="mb-4"
                  src={req.image}
                  alt={req.title}
                />
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${req.iconBg} flex items-center justify-center ${req.iconColor}`}
                  >
                    <span className="material-symbols-outlined">
                      {req.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {categoryLabel(req.categoryId)}
                    </span>
                    <h3 className="font-bold text-lg truncate">{req.title}</h3>
                  </div>
                  {req.urgent && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                    <span>Quantity</span>
                    <span className="font-semibold text-slate-700">
                      {formatQuantityLabel(req.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">Price (per unit)</span>
                    <span className="text-lg font-bold text-slate-900">
                      {req.budget}
                    </span>
                  </div>
                  {req.isNegotiable ? (
                    <p className="text-[11px] text-slate-400 mb-2">Open to other amounts</p>
                  ) : null}
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-violet-100/90 via-indigo-50 to-cyan-100/90 ring-1 ring-inset ring-black/[0.04]">
                    <div
                      className={`${req.barColor} h-full rounded-full transition-[width] duration-300`}
                      style={{
                        width:
                          boardBudgetMax > 0 && req.budgetMax > 0
                            ? `${budgetBarWidthPercent(req.budgetMax, boardBudgetMax)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {req.description}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>{req.postedAgo}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      group
                    </span>{" "}
                    {req.offerCount} Offers
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setOfferTarget(req)}
                    className="w-full flex-1 bg-[#607afb] text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Make an Offer
                  </button>
                  {req.auctionEnabled && (
                    <button
                      type="button"
                      onClick={() => setAuctionTarget(req)}
                      className="w-full flex-1 border-2 border-[#607afb] text-[#607afb] py-3 rounded-xl font-bold hover:bg-[#607afb]/5 active:scale-[0.98] transition-all"
                    >
                      {t("Join auction")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pro Seller Tip Banner */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="z-10 text-center md:text-left">
              <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Pro Seller Tip
              </span>
              <h2 className="text-3xl font-black mb-4 leading-tight">
                Earn more replies with detailed offers.
              </h2>
              <p className="text-blue-100 mb-6 max-w-md">
                Buyers are more likely to accept offers that include specific
                pricing, availability, and a clear next step.
              </p>
              <Link
                href="/help"
                className="inline-flex bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Learn How
              </Link>
            </div>
            <div className="relative z-10 w-full md:w-1/3">
              <div className="glass-card p-4 rounded-2xl shadow-2xl rotate-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100" />
                  <div className="h-2 w-24 bg-blue-200 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-200/50 rounded-full" />
                  <div className="h-2 w-5/6 bg-slate-200/50 rounded-full" />
                  <div className="h-10 w-full bg-blue-500/50 rounded-xl mt-4" />
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerTarget && (
        <OfferModal
          request={offerTarget}
          onClose={() => setOfferTarget(null)}
        />
      )}
      {auctionTarget && (
        <AuctionJoinModal
          request={auctionTarget}
          onClose={() => setAuctionTarget(null)}
        />
      )}
    </div>
    </RoleGate>
  );
}
