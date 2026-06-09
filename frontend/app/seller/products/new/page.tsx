'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RoleGate from "@/components/auth/RoleGate";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { apiFetchWithRefresh } from "@/lib/api";
import { canUseSellerWorkspace } from "@/lib/workspace";
import { uploadCatalogImage } from "@/lib/catalog";
import { useCategoryLabel } from "@/hooks/useCategoryLabel";

type Category = {
  id: string;
  name: string;
  slug: string;
};

function mergeFilesFromInput(list: FileList | null): File[] {
  if (list == null) return [];
  return Array.from(list);
}

function looksLikeImageSrc(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return true;
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  if (t.startsWith("/uploads/")) return true;
  return false;
}

export default function NewCatalogProductPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useWorkspace();
  const sellerWorkspace = canUseSellerWorkspace(user, activeRole);
  const router = useRouter();
  const categoryLabel = useCategoryLabel();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlLines, setGalleryUrlLines] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const mainPreviewRef = useRef<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || !sellerWorkspace) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetchWithRefresh<Category[]>("/api/v1/catalog/categories", {
          service: "catalog",
        });
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, sellerWorkspace]);

  const revokeMainBlob = useCallback(() => {
    if (mainPreviewRef.current != null) {
      URL.revokeObjectURL(mainPreviewRef.current);
      mainPreviewRef.current = null;
    }
    setMainPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      revokeMainBlob();
    };
  }, [revokeMainBlob]);

  const pendingGalleryLineUrls = useMemo(() => {
    const lines = galleryUrlLines
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => looksLikeImageSrc(s));
    return [...new Set(lines)];
  }, [galleryUrlLines]);

  const onUploadMain = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      revokeMainBlob();
      const blob = URL.createObjectURL(file);
      mainPreviewRef.current = blob;
      setMainPreview(blob);
      setUploadingMain(true);
      setError("");
      try {
        const url = await uploadCatalogImage(file);
        revokeMainBlob();
        setImageUrl(url);
      } catch (err: unknown) {
        revokeMainBlob();
        const e = err as Error;
        setError(e.message || "Main image upload failed");
      } finally {
        setUploadingMain(false);
      }
    },
    [revokeMainBlob],
  );

  const onUploadGallery = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingGallery(true);
    setError("");
    try {
      const urls = await Promise.all(files.map((f) => uploadCatalogImage(f)));
      setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
    }
  }, []);

  const removeGalleryAtIndex = useCallback((index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removePendingGalleryUrl = useCallback((urlToRemove: string) => {
    const trimmed = urlToRemove.trim();
    const next = galleryUrlLines
      .split(/\r?\n/)
      .filter((line) => line.trim() !== trimmed)
      .join("\n");
    setGalleryUrlLines(next);
  }, [galleryUrlLines]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sellerWorkspace) return;
      setError("");
      setSubmitting(true);
      try {
        const fromLines = galleryUrlLines
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        const mergedGallery = [...galleryUrls, ...fromLines];

        const parsedPrice = Number(price);
        const parsedQty = Number.parseInt(quantity, 10);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          throw new Error("Enter a price greater than 0.");
        }
        if (!Number.isFinite(parsedQty) || parsedQty < 0) {
          throw new Error("Quantity must be 0 or more.");
        }

        const body: Record<string, unknown> = {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          price: parsedPrice,
          currency: currency.trim().toUpperCase(),
          imageUrl: imageUrl.trim(),
          status,
          galleryUrls: mergedGallery,
          quantity: parsedQty,
          compareAtPrice: null,
        };

        const created = await apiFetchWithRefresh<{ slug: string }>("/api/v1/catalog/products", {
          method: "POST",
          service: "catalog",
          body: JSON.stringify(body),
        });

        router.push(`/products/${created.slug}`);
      } catch (err: unknown) {
        const e = err as Error & { data?: { errors?: { field: string; message: string }[] } };
        const details = e.data?.errors?.map((x) => `${x.field}: ${x.message}`).join("; ");
        setError(details || e.message || "Could not create product");
      } finally {
        setSubmitting(false);
      }
    },
    [
      sellerWorkspace,
      title,
      description,
      categoryId,
      price,
      currency,
      quantity,
      imageUrl,
      galleryUrls,
      galleryUrlLines,
      status,
      router,
    ],
  );

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title="Seller workspace"
      description="Catalog products are created in seller mode. Switch to seller using the toggle in the navbar."
      ctaHref="/seller/listings"
      ctaLabel="My listings"
      unauthenticatedDescription="Log in to add products to the catalog."
    >
    <div className="app-page app-page-narrow pb-16 sm:pb-20">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">New product</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          List a product with price and stock. Buyers can add it to the cart and checkout like on a marketplace.
        </p>
      </div>

      <form onSubmit={onSubmit} className="app-card space-y-5 rounded-xl p-4 shadow-sm sm:p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Title</label>
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <fieldset className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
          <legend className="px-1 text-sm font-bold text-[var(--foreground)]">Price &amp; stock (required)</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price</label>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                placeholder="e.g. 29.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              >
                {["USD", "EUR", "RUB", "KZT"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Quantity in stock</label>
            <input
              required
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Description</label>
          <textarea
            required
            minLength={10}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Main image</span>
          <input
            ref={mainInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              void onUploadMain(mergeFilesFromInput(e.target.files));
              e.target.value = "";
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                mainInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onUploadMain(mergeFilesFromInput(e.dataTransfer.files));
            }}
            onClick={() => mainInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors ${
              uploadingMain ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/60 bg-slate-50/80"
            }`}
          >
            {uploadingMain ? (
              <span className="text-slate-600">Uploading…</span>
            ) : imageUrl.trim() || mainPreview ? (
              <span className="text-slate-600">Replace image — click or drop a new file</span>
            ) : (
              <span className="text-slate-600">
                Drag and drop an image here, or click to choose a file (JPEG, PNG, WebP, GIF, max 5 MB).
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Or paste a direct HTTPS image URL:</p>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              revokeMainBlob();
              setImageUrl(e.target.value);
            }}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          />
          {(mainPreview != null || (imageUrl.trim().length > 0 && looksLikeImageSrc(imageUrl))) && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={mainPreview ?? imageUrl.trim()}
                  alt="Main image preview"
                  className="mx-auto max-h-64 w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {uploadingMain && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-700">
                    Uploading…
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() => {
                    revokeMainBlob();
                    setImageUrl("");
                  }}
                >
                  Clear main image
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Extra photos (gallery)</span>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              void onUploadGallery(mergeFilesFromInput(e.target.files));
              e.target.value = "";
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                galleryInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onUploadGallery(mergeFilesFromInput(e.dataTransfer.files));
            }}
            onClick={() => galleryInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
              uploadingGallery ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/60 bg-slate-50/80"
            }`}
          >
            {uploadingGallery ? (
              <span className="text-slate-600">Uploading…</span>
            ) : (
              <span className="text-slate-600">
                Drop multiple images or click to add (same rules as main image).
              </span>
            )}
          </div>
          {galleryUrls.length > 0 && (
            <div className="mt-3 flex max-w-full flex-wrap gap-1.5">
              {galleryUrls.map((u, i) => (
                <div
                  key={`${u}-${i}`}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-sm"
                >
                  <img
                    src={u}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.25";
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 z-10 flex h-5 w-5 items-center justify-center rounded-bl-md bg-black/70 text-white hover:bg-black/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGalleryAtIndex(i);
                    }}
                    aria-label="Remove image"
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="mt-3 block text-sm font-medium text-slate-700">Gallery image URLs (optional)</label>
          <textarea
            rows={2}
            value={galleryUrlLines}
            onChange={(e) => setGalleryUrlLines(e.target.value)}
            placeholder="One HTTPS URL per line"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary font-mono text-xs"
          />
          {pendingGalleryLineUrls.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Preview from URL lines (saved when you submit)</p>
              <div className="flex max-w-full flex-wrap gap-1.5">
                {pendingGalleryLineUrls.map((u, i) => (
                  <div
                    key={`pending-${i}-${u.slice(0, 48)}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50"
                  >
                    <img
                      src={u}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0.15";
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 z-10 flex h-5 w-5 items-center justify-center rounded-bl-md bg-black/70 text-white hover:bg-black/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePendingGalleryUrl(u);
                      }}
                      aria-label="Remove URL from list"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          >
            <option value="published">Published (visible in catalog)</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !imageUrl.trim()}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Publish listing"}
          </button>
          <Link
            href="/products"
            className="inline-flex items-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
    </RoleGate>
  );
}
