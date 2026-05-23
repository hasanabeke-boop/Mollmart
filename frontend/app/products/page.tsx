'use client';

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ShowcaseItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string;
  quantity: number;
  category: { id: string; name: string; slug: string } | null;
};

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const BUYER_REC_HINT =
  "To get personalized recommendations, submit a buyer request or choose category preferences in your profile settings.";
const GUEST_REC_HINT =
  "Sign in to see recommendations based on your profile and requests. After signing in, submit a buyer request or choose preferences in your profile settings.";

export default function ShowcaseBrowsePage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstLoadDone = useRef(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [hasRecommendationSignals, setHasRecommendationSignals] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q")?.trim();
    if (initialQ) {
      setQ(initialQ);
      setDebouncedQ(initialQ);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<Category[]>("/api/v1/catalog/categories", { service: "catalog" });
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadItems = useCallback(async () => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;

    const isFirst = !firstLoadDone.current;
    if (isFirst) {
      setLoading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      params.set("sort", "newest");
      params.set("currency", "USD");
      if (debouncedQ) params.set("q", debouncedQ);

      if (showRecommendations) {
        if (!user) {
          setHasRecommendationSignals(false);
          setItems([]);
          setMeta({ page: 1, limit: 12, total: 0, totalPages: 0 });
          if (!ac.signal.aborted) {
            setLoading(false);
            firstLoadDone.current = true;
          }
          return;
        }
        const data = await apiFetchWithRefresh<{
          items: ShowcaseItem[];
          meta: PageMeta;
          hasRecommendationSignals?: boolean;
        }>(`/api/v1/catalog/products/recommended?${params.toString()}`, {
          service: "catalog",
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setItems(data.items ?? []);
        setMeta(data.meta ?? null);
        setHasRecommendationSignals(data.hasRecommendationSignals ?? true);
      } else {
        if (categoryId) params.set("categoryId", categoryId);
        const data = await apiFetch<{ items: ShowcaseItem[]; meta: PageMeta }>(
          `/api/v1/catalog/products?${params.toString()}`,
          { service: "catalog", signal: ac.signal },
        );
        if (ac.signal.aborted) return;
        setItems(data.items ?? []);
        setMeta(data.meta ?? null);
        setHasRecommendationSignals(null);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load showcase";
      if (!ac.signal.aborted) {
        setError(msg);
        setItems([]);
        setMeta(null);
        if (showRecommendations) setHasRecommendationSignals(null);
      }
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
        firstLoadDone.current = true;
      }
    }
  }, [page, debouncedQ, categoryId, showRecommendations, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadItems();
  }, [loadItems, authLoading]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedQ, showRecommendations, categoryId]);

  const total = meta?.total ?? items.length;
  const totalPages = meta?.totalPages ?? 1;

  const pageTitle = useMemo(() => {
    if (showRecommendations) return "Recommendations";
    if (categoryId) {
      const c = categories.find((x) => x.id === categoryId);
      return c ? c.name : "Showcase";
    }
    return "Seller showcase";
  }, [showRecommendations, categoryId, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <nav aria-label="Breadcrumb" className="flex mb-4">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">home</span>
            </Link>
          </li>
          <li>
            <span className="text-slate-400">/</span>
          </li>
          <li>
            <span aria-current="page" className="text-sm font-medium text-primary">
              {pageTitle}
            </span>
          </li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{pageTitle}</h1>
        <p className="mt-2 text-base text-slate-500 max-w-3xl">
          Browse seller listings, add available products to cart, or create a buyer request when you want sellers to compete.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="lg:hidden flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm"
          >
            <span className="material-symbols-outlined">filter_list</span>
            Filters
          </button>

          <div className={`${filtersOpen ? "block" : "hidden"} lg:block space-y-8`}>
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Browse</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="cat"
                    checked={showRecommendations}
                    onChange={() => {
                      setShowRecommendations(true);
                      setCategoryId("");
                      setPage(1);
                    }}
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
                    Recommendations
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="cat"
                    checked={!showRecommendations && categoryId === ""}
                    onChange={() => {
                      setShowRecommendations(false);
                      setCategoryId("");
                      setPage(1);
                    }}
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    All categories
                  </span>
                </label>
                {!showRecommendations &&
                  categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="cat"
                        checked={categoryId === c.id}
                        onChange={() => {
                          setShowRecommendations(false);
                          setCategoryId(c.id);
                          setPage(1);
                        }}
                        className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                        {c.name}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-sm border border-slate-100 min-h-[3.25rem]">
            <p className="pl-2 text-sm text-slate-500">
              {loading ? (
                <span>Loading…</span>
              ) : (
                <span>
                  Showing <span className="font-bold text-slate-900">{items.length}</span> of{" "}
                  <span className="font-bold text-slate-900">{total}</span> examples
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : ""}`}
                aria-pressed={viewMode === "grid"}
              >
                <span className="material-symbols-outlined filled">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : ""}`}
                aria-pressed={viewMode === "list"}
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading &&
            items.length === 0 &&
            !error &&
            showRecommendations &&
            (hasRecommendationSignals === false ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-semibold text-amber-900 mb-1">No recommendation data yet</p>
                <p className="text-amber-900/90">{user ? BUYER_REC_HINT : GUEST_REC_HINT}</p>
                {user && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link href="/create-product-request" className="font-bold text-primary hover:underline">
                      Create a request
                    </Link>
                    <Link href="/profile" className="font-bold text-primary hover:underline">
                      Profile settings
                    </Link>
                  </div>
                )}
                {!user && !authLoading && (
                  <Link href="/login" className="mt-3 inline-block font-bold text-primary hover:underline">
                    Sign in
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">No examples match your search in these categories yet.</p>
            ))}

          {!loading && items.length === 0 && !error && !showRecommendations && (
            <p className="text-center text-slate-500 py-12">No examples match your search yet.</p>
          )}

          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {items.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className={`group block overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 transition-shadow hover:shadow-md ${
                  viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
                }`}
              >
                <div
                  className={`relative overflow-hidden bg-gray-100 ${
                    viewMode === "list" ? "w-full sm:w-64 aspect-[4/3] shrink-0" : "w-full aspect-[4/3]"
                  }`}
                >
                  <img
                    alt={product.title}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    src={product.imageUrl}
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {product.category && (
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3 mt-1">{product.description}</p>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <span className="block text-base font-black text-[#0d1b12]">
                        {formatCatalogMoney(product.price, product.currency, 2)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary">View</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
