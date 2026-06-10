'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCategoryLabel } from "@/hooks/useCategoryLabel";
import ReportContentModal from "@/components/moderation/ReportContentModal";
import { apiFetchWithRefresh } from "@/lib/api";
import { formatCatalogMoney, normalizeCatalogProductSlug } from "@/lib/catalog";
import { addCartItem } from "@/lib/shop";

type ShowcaseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string;
  galleryUrls: string[];
  quantity: number;
  status?: string;
  category: { id: string; name: string; slug: string } | null;
  seller: { id: string; name: string };
};

export default function ShowcaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const slugParam = typeof params.slug === "string" ? params.slug : "";
  const slug = normalizeCatalogProductSlug(slugParam);

  const [product, setProduct] = useState<ShowcaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetchWithRefresh<ShowcaseDetail>(
          `/api/v1/catalog/products/slug/${encodeURIComponent(slug)}`,
          { service: "catalog" },
        );
        if (!cancelled) {
          setProduct(data);
          setActiveIndex(0);
        }
      } catch (e: unknown) {
        const err = e as Error & { status?: number };
        if (!cancelled) {
          setProduct(null);
          setError(err.status === 404 ? t("Listing not found.") : err.message || t("Failed to load catalog"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const images = useMemo(() => {
    if (!product) return [];
    const extra = Array.isArray(product.galleryUrls) ? product.galleryUrls.filter(Boolean) : [];
    const list = [product.imageUrl, ...extra.filter((u) => u !== product.imageUrl)];
    return list.length > 0 ? list : [];
  }, [product]);

  const mainImage = images[activeIndex] ?? "";

  const requestHref = useMemo(() => {
    if (!product?.slug) return "/create-product-request";
    return `/create-product-request?fromShowcase=${encodeURIComponent(product.slug)}`;
  }, [product?.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 text-center text-[var(--text-muted)]">
        {t("Loading…")}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-[var(--foreground)]">{error || t("Listing unavailable.")}</p>
        <Link href="/products" className="text-primary font-semibold hover:underline">
          {t("Back to catalog")}
        </Link>
      </div>
    );
  }

  const isOwnListing = user?.id === product.seller.id;
  const inStock = product.quantity > 0;
  const isDraftPreview = isOwnListing && product.status === "draft";
  const isArchivedPreview = isOwnListing && product.status === "archived";

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }
    setAdding(true);
    setCartMessage("");
    try {
      await addCartItem(product.id, 1);
      setCartMessage(t("Added to cart."));
    } catch (err: unknown) {
      setCartMessage((err as Error).message || t("Failed to add to cart."));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="app-page app-page-wide max-w-[90rem]">
      <div className="flex flex-wrap gap-2 px-4 pb-6">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          {t("Home")}
        </Link>
        <span className="text-sm font-medium text-primary">/</span>
        <Link href="/products" className="text-sm font-medium text-primary hover:underline">
          {t("Catalog")}
        </Link>
        {product.category && (
          <>
            <span className="text-sm font-medium text-primary">/</span>
            <span className="text-sm font-medium text-[var(--foreground)]">{categoryLabel(product.category)}</span>
          </>
        )}
        <span className="text-sm font-medium text-primary">/</span>
        <span className="line-clamp-1 text-sm font-medium text-[var(--foreground)]">{product.title}</span>
      </div>

      {(isDraftPreview || isArchivedPreview) && (
        <div className="mx-4 mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--foreground)]">
          {isDraftPreview
            ? t(
                "This listing is a draft — only you can see this preview. Publish it from My listings to show it in the catalog.",
              )
            : t("This listing is archived and not shown in the public catalog.")}
          {isDraftPreview && (
            <Link href="/seller/listings" className="ml-2 font-semibold text-primary hover:underline">
              {t("My listings")}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="app-card relative aspect-square w-full overflow-hidden rounded-xl md:aspect-[4/3]">
            {mainImage ? (
              <div
                className="w-full h-full bg-center bg-contain bg-no-repeat p-8 transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url("${mainImage}")` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--text-muted)]">{t("No image")}</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`shrink-0 size-20 rounded-lg border bg-[var(--surface)] p-2 md:size-24 ${
                    activeIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  <div
                    className="w-full h-full bg-center bg-cover bg-no-repeat rounded"
                    style={{ backgroundImage: `url("${img}")` }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {product.category && (
              <span className="w-fit rounded bg-primary/15 px-2 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {categoryLabel(product.category)}
              </span>
            )}
            <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] md:text-4xl">{product.title}</h1>
          </div>

          <div className="app-card rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{t("Price")}</p>
                <p className="text-3xl font-black text-[var(--foreground)]">
                  {formatCatalogMoney(product.price, product.currency, 2)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  inStock
                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                    : "bg-red-500/15 text-red-700 dark:text-red-400"
                }`}
              >
                {inStock
                  ? t("{count} in stock", { count: product.quantity })
                  : t("Out of stock")}
              </span>
            </div>
          </div>

          <div className="app-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-[var(--foreground)]">
                {product.seller.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-[var(--foreground)]">{product.seller.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{t("Seller")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[200px]">
              {isOwnListing ? (
                <p className="text-sm text-[var(--text-muted)]">
                  {isDraftPreview
                    ? t(
                        "This listing is a draft — only you can see this preview. Publish it from My listings to show it in the catalog.",
                      )
                    : t("This is your listing.")}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!inStock || adding}
                    onClick={handleAddToCart}
                    className="min-h-10 px-4 rounded-lg bg-primary text-[#0d1b12] text-sm font-bold hover:bg-[#0fd650] disabled:opacity-60 flex items-center justify-center text-center"
                  >
                    {adding
                      ? t("Adding...")
                      : inStock
                        ? t("Add to cart")
                        : t("Out of stock")}
                  </button>
                  <Link
                    href={user ? requestHref : `/login?returnUrl=${encodeURIComponent(requestHref)}`}
                    className="flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  >
                    {t("Request something like this")}
                  </Link>
                  <Link
                    href="/cart"
                    className="flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  >
                    {t("View cart")}
                  </Link>
                  {cartMessage ? (
                    <p className="text-center text-xs text-primary sm:text-right">{cartMessage}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 whitespace-pre-wrap border-t border-[var(--border)] pt-4 text-sm leading-relaxed text-[var(--foreground)]">
            {product.description}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="text-primary font-semibold hover:underline"
            >
              {t("← More products")}
            </button>
            {!isOwnListing && user && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="font-semibold text-red-600 hover:underline"
              >
                {t("Report")}
              </button>
            )}
          </div>
        </div>
      </div>

      {product && (
        <ReportContentModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="catalog_product"
          targetId={product.id}
          targetLabel={product.title}
        />
      )}
    </div>
  );
}
