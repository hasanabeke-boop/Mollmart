'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiFetch } from "@/lib/api";
import { uploadCatalogImage } from "@/lib/catalog";
import { formatCatalogMoney } from "@/lib/catalog";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import {
  deleteListingProduct,
  fetchMyListingsPage,
  patchListingProduct,
  type SellerListingProduct,
  type SellerListingPageMeta,
} from "@/lib/catalogSeller";
import { useToast } from "@/context/ToastContext";
import RoleGate from "@/components/auth/RoleGate";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCategoryLabel } from "@/hooks/useCategoryLabel";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useModalPresence } from "@/hooks/useModalPresence";
import { canUseSellerWorkspace } from "@/lib/workspace";

type ApiCategory = { id: string; name: string; slug: string };

function mergeFilesFromInput(list: FileList | null): File[] {
  if (list == null) return [];
  return Array.from(list);
}

export default function SellerListingsManagePage() {
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const { activeRole } = useWorkspace();
  const sellerWorkspace = canUseSellerWorkspace(user, activeRole);

  const [items, setItems] = useState<SellerListingProduct[]>([]);
  const [meta, setMeta] = useState<SellerListingPageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<SellerListingProduct | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlLines, setGalleryUrlLines] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<SellerListingProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const editModalOpen = Boolean(editOpen && editItem);
  const { mounted: editModalMounted, visible: editModalVisible } = useModalPresence(editModalOpen);

  useEffect(() => {
    if (!editModalMounted) {
      setEditItem(null);
      setSaveError("");
    }
  }, [editModalMounted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiFetch<ApiCategory[]>("/api/v1/catalog/categories", { service: "catalog" });
        if (!cancelled) setCategories(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (!sellerWorkspace) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyListingsPage(page, 12);
      setItems(data.items ?? []);
      setMeta(data.meta ?? null);
    } catch (e: unknown) {
      const msg = (e as Error).message || "Failed to load product listings.";
      setError(msg);
      toast.error(msg);
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [sellerWorkspace, page, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!sellerWorkspace) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, sellerWorkspace, load]);

  const openEdit = useCallback((p: SellerListingProduct) => {
    setEditItem(p);
    setTitle(p.title);
    setDescription(p.description);
    setCategoryId(p.categoryId);
    setPrice(String(p.price));
    setQuantity(String(p.quantity));
    setStatus(p.status as "draft" | "published" | "archived");
    setImageUrl(p.imageUrl);
    setGalleryUrls(Array.isArray(p.galleryUrls) ? [...p.galleryUrls] : []);
    setGalleryUrlLines("");
    setSaveError("");
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
  }, []);

  const onUploadMain = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploadingMain(true);
    setSaveError("");
    try {
      const url = await uploadCatalogImage(file);
      setImageUrl(url);
      toast.success("Main image updated.");
    } catch (err: unknown) {
      setSaveError((err as Error).message || "Upload failed");
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setUploadingMain(false);
    }
  }, [toast]);

  const onUploadGallery = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploadingGallery(true);
      setSaveError("");
      try {
        const urls = await Promise.all(files.map((f) => uploadCatalogImage(f)));
        setGalleryUrls((prev) => [...prev, ...urls]);
        toast.success(urls.length > 1 ? "Images added." : "Image added.");
      } catch (err: unknown) {
        setSaveError((err as Error).message || "Gallery upload failed");
        toast.error((err as Error).message || "Gallery upload failed");
      } finally {
        setUploadingGallery(false);
      }
    },
    [toast],
  );

  const submitEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    setSaveError("");
    try {
      const fromLines = galleryUrlLines
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const mergedGallery = [...galleryUrls, ...fromLines];
      const parsedPrice = Number(price);
      const parsedQty = Number.parseInt(quantity, 10);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error("Price must be greater than 0.");
      }
      if (!Number.isFinite(parsedQty) || parsedQty < 0) {
        throw new Error("Quantity must be 0 or more.");
      }
      await patchListingProduct(editItem.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        price: parsedPrice,
        currency: DEFAULT_CURRENCY,
        quantity: parsedQty,
        status,
        imageUrl: imageUrl.trim(),
        galleryUrls: mergedGallery,
      });
      toast.success("Product saved.");
      setEditOpen(false);
      await load();
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not save.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { outcome } = await deleteListingProduct(deleteTarget.id);
      if (outcome === "deleted") {
        toast.success("Listing removed.");
      } else {
        toast.success("Listing had past orders — it was archived instead of deleted.");
      }
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not remove listing.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusStyle = useMemo(
    () =>
      ({
        published: "bg-emerald-100 text-emerald-900",
        draft: "bg-slate-100 text-slate-700",
        archived: "bg-amber-100 text-amber-900",
      }) as Record<string, string>,
    [],
  );

  const totalPages = meta?.totalPages ?? 1;

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title={t("Seller workspace")}
      description={t("Manage your catalog products in seller mode. Switch to seller using the toggle in the navbar.")}
      ctaHref="/seller/products/new"
      ctaLabel={t("New product")}
      unauthenticatedDescription={t("Log in to manage your product listings.")}
    >
    <main className="mx-auto max-w-5xl px-3 py-6 pb-16 sm:px-4 sm:py-8 sm:pb-20">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">{t("My listings")}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">
            {t("Set price and stock for each product. Published items appear in the buyer catalog and can be purchased via cart.")}
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-[#0d1b12] shadow-sm hover:opacity-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {t("New listing")}
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="app-card rounded-2xl p-10 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{t("No products yet")}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("Add your first product with price and quantity to sell in the catalog.")}</p>
          <Link href="/seller/products/new" className="mt-6 inline-block font-bold text-primary hover:underline">
            {t("New product")}
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((p) => (
            <section
              key={p.id}
              className="app-card overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-auto sm:w-44">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">{t("No image")}</div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${statusStyle[p.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {p.status}
                    </span>
                    {p.category && (
                      <span className="text-xs font-medium text-slate-500">{categoryLabel(p.category)}</span>
                    )}
                  </div>
                  <h2 className="line-clamp-2 text-xl font-bold text-[var(--foreground)]">{p.title}</h2>
                  <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{p.description}</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {formatCatalogMoney(p.price, p.currency, 2)}
                    <span className="ml-2 font-medium text-[var(--text-muted)]">
                      · {p.quantity > 0 ? t("{count} in stock", { count: p.quantity }) : t("Out of stock")}
                    </span>
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link
                      href={`/products/${p.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {t("View public")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {t("Edit")}
                    </button>
                    <button
                      type="button"
                      disabled={deleteTarget != null}
                      onClick={() => setDeleteTarget(p)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {t("Delete")}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && items.length > 0 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
          >
            {t("Previous")}
          </button>
          <span className="text-sm text-slate-600">
            {t("Page {page} of {totalPages}", { page, totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((x) => x + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
          >
            {t("Next")}
          </button>
        </div>
      )}

      {editModalMounted && editItem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
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
              editModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-lg font-black text-[var(--foreground)]">{t("Edit product")}</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">{t("Title")}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">{t("Category")}</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">
                    {t("Price")} (₸)
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">{t("Quantity in stock")}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="published">{t("Published (visible in catalog)")}</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
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

              <div>
                <span className="block text-xs font-bold uppercase text-slate-500">Main image</span>
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
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  disabled={uploadingMain}
                  className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:border-primary/50 disabled:opacity-50"
                >
                  {uploadingMain ? t("Uploading…") : t("Replace main image")}
                </button>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t("Image URL")}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <span className="block text-xs font-bold uppercase text-slate-500">Gallery</span>
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
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:border-primary/50 disabled:opacity-50"
                >
                  {uploadingGallery ? t("Uploading…") : t("Add gallery images")}
                </button>
                {galleryUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {galleryUrls.map((u, i) => (
                      <div key={`${u}-${i}`} className="relative h-12 w-12 overflow-hidden rounded border border-slate-200">
                        <img src={u} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-black/70 text-white text-[10px]"
                          onClick={() => setGalleryUrls((prev) => prev.filter((_, j) => j !== i))}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  rows={2}
                  value={galleryUrlLines}
                  onChange={(e) => setGalleryUrlLines(e.target.value)}
                  placeholder={t("Extra image URLs, one per line")}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}

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
                disabled={saving || !imageUrl.trim() || categories.length === 0}
                onClick={() => void submitEdit()}
                className="rounded-xl bg-[#607afb] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? t("Saving...") : t("Save changes")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget != null}
        title={t("Remove this listing?")}
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from your catalog. If it was linked to past orders, it may be archived instead of fully deleted.`
            : ""
        }
        confirmLabel={t("Remove")}
        variant="danger"
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
        onConfirm={runDelete}
      />
    </main>
    </RoleGate>
  );
}
