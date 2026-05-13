'use client';

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import { addToShopCart } from "@/lib/shop";
import { formatCatalogMoney, normalizeCatalogCurrencyCode } from "@/lib/catalog";

type CatalogProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  listedPrice?: number;
  listedCurrency?: string;
  imageUrl: string;
  galleryUrls: string[];
  quantity: number;
  category: { id: string; name: string; slug: string } | null;
  seller: { id: string; name: string };
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const displayCurrency = useMemo(
    () => normalizeCatalogCurrencyCode(searchParams.get("currency")),
    [searchParams],
  );

  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        qs.set("currency", displayCurrency);
        const data = await apiFetch<CatalogProductDetail>(
          `/api/v1/catalog/products/slug/${encodeURIComponent(slug)}?${qs.toString()}`,
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
          setError(err.status === 404 ? "Product not found." : err.message || "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, displayCurrency]);

  const images = useMemo(() => {
    if (!product) return [];
    const extra = Array.isArray(product.galleryUrls) ? product.galleryUrls.filter(Boolean) : [];
    const list = [product.imageUrl, ...extra.filter((u) => u !== product.imageUrl)];
    return list.length > 0 ? list : [];
  }, [product]);

  const mainImage = images[activeIndex] ?? "";

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 text-center text-slate-500">
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-700 mb-4">{error || "Product unavailable."}</p>
        <Link href="/products" className="text-primary font-semibold hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const discountPct =
    product.compareAtPrice != null && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const isOwnListing = user?.id === product.seller.id;

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/products/${slug}?currency=${displayCurrency}`)}`);
      return;
    }
    if (product.quantity < 1) {
      toast.error("This product is out of stock.");
      return;
    }
    if (isOwnListing) {
      toast.error("You cannot add your own product to the cart.");
      return;
    }
    setAddingCart(true);
    try {
      await addToShopCart(product.id, 1);
      toast.success("Added to cart.");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not add to cart");
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20 py-6">
      <div className="flex flex-wrap gap-2 pb-6 px-4">
        <Link href="/" className="text-[#4c9a66] text-sm font-medium hover:underline">
          Home
        </Link>
        <span className="text-[#4c9a66] text-sm font-medium">/</span>
        <Link href="/products" className="text-[#4c9a66] text-sm font-medium hover:underline">
          Catalog
        </Link>
        {product.category && (
          <>
            <span className="text-[#4c9a66] text-sm font-medium">/</span>
            <span className="text-[#0d1b12] text-sm font-medium">{product.category.name}</span>
          </>
        )}
        <span className="text-[#4c9a66] text-sm font-medium">/</span>
        <span className="text-[#0d1b12] text-sm font-medium line-clamp-1">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-square md:aspect-[4/3] bg-white rounded-xl border border-[#e7f3eb] overflow-hidden relative group">
            {mainImage ? (
              <div
                className="w-full h-full bg-center bg-contain bg-no-repeat p-8 transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url("${mainImage}")` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No image</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`shrink-0 size-20 md:size-24 rounded-lg bg-white p-2 border ${
                    activeIndex === index ? "border-primary" : "border-transparent hover:border-[#e7f3eb]"
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
              <span className="px-2 py-1 rounded bg-[#e7f3eb] text-[#4c9a66] text-xs font-bold uppercase tracking-wider w-fit">
                {product.category.name}
              </span>
            )}
            <h1 className="text-[#0d1b12] text-3xl md:text-4xl font-bold leading-tight">{product.title}</h1>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e7f3eb] shadow-sm">
            <p className="text-[#4c9a66] text-xs font-bold uppercase tracking-wider">Price</p>
            <div className="flex items-end gap-3 flex-wrap mt-1">
              <p className="text-[#0d1b12] text-4xl font-black tracking-tight">
                {formatCatalogMoney(product.price, product.currency, 2)}
              </p>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <>
                  <p className="text-[#4c9a66] text-lg line-through mb-1.5">
                    {formatCatalogMoney(product.compareAtPrice, product.currency, 2)}
                  </p>
                  {discountPct != null && (
                    <span className="mb-2 px-2 py-0.5 rounded-full bg-primary/20 text-[#0d1b12] text-xs font-bold">
                      −{discountPct}%
                    </span>
                  )}
                </>
              )}
            </div>
            {product.listedPrice != null &&
              product.listedCurrency &&
              product.listedCurrency.trim().toUpperCase() !== product.currency.trim().toUpperCase() && (
                <p className="mt-2 text-xs text-[#4c9a66]">
                  Listed at{" "}
                  <span className="font-semibold text-[#0d1b12]">
                    {formatCatalogMoney(product.listedPrice, product.listedCurrency, 2)}
                  </span>
                </p>
              )}
            <p className="mt-3 text-sm text-[#0d1b12]/80">
              {product.quantity > 0 ? (
                <span>
                  <span className="font-semibold text-emerald-700">In stock:</span> {product.quantity} available
                </span>
              ) : (
                <span className="font-semibold text-amber-800">Out of stock</span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white border border-[#e7f3eb]">
            <div className="flex items-center gap-3 flex-1">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-[#0d1b12]">
                {product.seller.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <p className="text-[#0d1b12] font-bold text-sm">Sold by {product.seller.name}</p>
                <p className="text-xs text-[#4c9a66]">Catalog seller</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex flex-wrap gap-2 w-full sm:justify-end">
                <button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  disabled={addingCart || product.quantity < 1 || isOwnListing}
                  className="flex-1 sm:flex-none min-h-10 px-4 rounded-lg bg-primary text-[#0d1b12] text-sm font-bold hover:bg-[#0fd650] disabled:opacity-50"
                >
                  {addingCart ? "Adding…" : "Add to cart"}
                </button>
                <Link
                  href="/cart"
                  className="flex-1 sm:flex-none min-h-10 px-4 rounded-lg border border-[#e7f3eb] text-[#0d1b12] text-sm font-bold flex items-center justify-center hover:bg-[#f6f8f6]"
                >
                  View cart
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e7f3eb] text-[#0d1b12]/80 text-sm space-y-3 whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      </div>
    </div>
  );
}
