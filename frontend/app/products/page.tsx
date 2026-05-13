'use client';

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  CATALOG_CURRENCIES,
  formatCatalogMoney,
  PRICE_FILTER_MAX,
} from "@/lib/catalog";
import DualPriceRange from "@/components/catalog/DualPriceRange";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CatalogProduct = {
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

const RANGE_MIN = 0;
const RANGE_MAX = PRICE_FILTER_MAX;

const BUYER_REC_HINT =
  "To get personalized recommendations, submit a buyer request or choose category preferences in your profile settings.";
const GUEST_REC_HINT =
  "Sign in to see recommendations based on your profile and requests. After signing in, submit a buyer request or choose preferences in your profile settings.";

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstLoadDone = useRef(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  /** When true, load personalized recommendations (auth); first tab in UI. */
  const [catalogRecommendations, setCatalogRecommendations] = useState(true);
  const [hasRecommendationSignals, setHasRecommendationSignals] = useState<boolean | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>("USD");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState(RANGE_MIN);
  const [maxPrice, setMaxPrice] = useState(RANGE_MAX);
  const [debouncedMin, setDebouncedMin] = useState(RANGE_MIN);
  const [debouncedMax, setDebouncedMax] = useState(RANGE_MAX);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const min = Math.min(Math.max(minPrice, RANGE_MIN), maxPrice);
    const max = Math.max(Math.min(maxPrice, RANGE_MAX), min);
    const t = setTimeout(() => {
      setDebouncedMin(min);
      setDebouncedMax(max);
    }, 500);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

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

  const loadProducts = useCallback(async () => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;

    const isFirst = !firstLoadDone.current;
    if (isFirst) {
      setLoading(true);
    }
    setError("");

    const min = Math.min(Math.max(debouncedMin, RANGE_MIN), debouncedMax);
    const max = Math.max(Math.min(debouncedMax, RANGE_MAX), min);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      params.set("sort", sort);
      params.set("currency", filterCurrency);
      if (debouncedQ) params.set("q", debouncedQ);
      if (min > RANGE_MIN) params.set("minPrice", String(min));
      if (max < RANGE_MAX) params.set("maxPrice", String(max));

      if (catalogRecommendations) {
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
          items: CatalogProduct[];
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
        const data = await apiFetch<{ items: CatalogProduct[]; meta: PageMeta }>(
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
      const msg = e instanceof Error ? e.message : "Failed to load catalog";
      if (!ac.signal.aborted) {
        setError(msg);
        setItems([]);
        setMeta(null);
        if (catalogRecommendations) setHasRecommendationSignals(null);
      }
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
        firstLoadDone.current = true;
      }
    }
  }, [page, sort, debouncedQ, categoryId, debouncedMin, debouncedMax, filterCurrency, catalogRecommendations, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadProducts();
  }, [loadProducts, authLoading]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedMin, debouncedMax, filterCurrency, catalogRecommendations, categoryId]);

  const total = meta?.total ?? items.length;
  const totalPages = meta?.totalPages ?? 1;

  const pageTitle = useMemo(() => {
    if (catalogRecommendations) return "Recommendations";
    if (categoryId) {
      const c = categories.find((x) => x.id === categoryId);
      return c ? c.name : "Catalog";
    }
    return "Catalog";
  }, [catalogRecommendations, categoryId, categories]);

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
        <p className="mt-2 text-base text-slate-500">
          {catalogRecommendations
            ? "Products matched to your profile preferences and buyer requests."
            : "Browse products listed by sellers on Mollmart."}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <button
            type="button"
            className="lg:hidden flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm"
          >
            <span className="material-symbols-outlined">filter_list</span>
            Filters
          </button>

          <div className="hidden lg:block space-y-8">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Currency</h3>
              <p className="text-xs text-slate-500 leading-snug">
                Prices and the range filter use this currency only.
              </p>
              <select
                value={filterCurrency}
                onChange={(e) => {
                  setFilterCurrency(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-primary focus:ring-primary"
              >
                {CATALOG_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="cat"
                    checked={catalogRecommendations}
                    onChange={() => {
                      setCatalogRecommendations(true);
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
                    checked={!catalogRecommendations && categoryId === ""}
                    onChange={() => {
                      setCatalogRecommendations(false);
                      setCategoryId("");
                      setPage(1);
                    }}
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    All categories
                  </span>
                </label>
                {!catalogRecommendations &&
                  categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="cat"
                        checked={categoryId === c.id}
                        onChange={() => {
                          setCatalogRecommendations(false);
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

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Price range</h3>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Sliders: left = minimum, right = maximum. Upper cap{" "}
                {formatCatalogMoney(RANGE_MAX, filterCurrency)} is only for filtering in this list.
              </p>
              <div className="text-xs font-medium text-slate-600 tabular-nums">
                {formatCatalogMoney(minPrice, filterCurrency)} – {formatCatalogMoney(maxPrice, filterCurrency)}
              </div>
              <DualPriceRange
                min={minPrice}
                max={maxPrice}
                rangeMin={RANGE_MIN}
                rangeMax={RANGE_MAX}
                onChange={(nextMin, nextMax) => {
                  setMinPrice(nextMin);
                  setMaxPrice(nextMax);
                }}
              />
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
                  <span className="font-bold text-slate-900">{total}</span> results
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-1">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as typeof sort);
                  setPage(1);
                }}
                className="cursor-pointer appearance-none rounded-lg border-0 bg-[#f5f6f8] py-1.5 pl-3 pr-8 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
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
            catalogRecommendations &&
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
              <p className="text-center text-slate-500 py-12">No products match your filters in these categories yet.</p>
            ))}

          {!loading && items.length === 0 && !error && !catalogRecommendations && (
            <p className="text-center text-slate-500 py-12">No products match your filters yet.</p>
          )}

          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {items.map((product) => {
              const inStock = product.quantity > 0;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}?currency=${encodeURIComponent(filterCurrency)}`}
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
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${
                          inStock ? "bg-emerald-600/90 text-white" : "bg-slate-800/85 text-white"
                        }`}
                      >
                        {inStock ? `In stock (${product.quantity})` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-900">
                          {formatCatalogMoney(product.price, product.currency, 2)}
                        </span>
                        {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCatalogMoney(product.compareAtPrice, product.currency, 2)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary">View</span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
