'use client';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { uploadCatalogImage } from "@/lib/catalog";
import { resendVerificationEmail } from "@/lib/emailVerification";
import { useAuth } from "@/context/AuthContext";
import RoleGate from "@/components/auth/RoleGate";

type ApiCategory = { id: string; name: string; slug: string };

type ShowcaseForPrefill = {
  slug: string;
  title: string;
  description: string;
  category: { id: string; name: string; slug: string } | null;
  seller: { id: string; name: string };
};

const CURRENCIES = [
  { code: "KZT", label: "KZT — Kazakhstani Tenge (₸)" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "RUB", label: "RUB — Russian Ruble" },
];

const MAX_DESC = 1000;

const MAX_REQUEST_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function mergeFilesFromInput(list: FileList | null): File[] {
  if (list == null) return [];
  return Array.from(list);
}

function filterImageFiles(files: File[]): File[] {
  return files.filter((f) => PHOTO_MIMES.has(f.type) && f.size > 0 && f.size <= MAX_PHOTO_BYTES);
}

type RequestPhotoAttachment = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
};

type FormErrors = {
  title?: string;
  category?: string;
  quantity?: string;
  budget?: string;
  description?: string;
};

export default function CreateProductRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">Loading…</div>
      }
    >
      <CreateProductRequestContent />
    </Suspense>
  );
}

function CreateProductRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [catalogCategories, setCatalogCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const lastPrefillSlug = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("KZT");
  const [quantity, setQuantity] = useState("1");
  const [budget, setBudget] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const [attachments, setAttachments] = useState<RequestPhotoAttachment[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [photoDropActive, setPhotoDropActive] = useState(false);
  const photoDragDepthRef = useRef(0);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<RequestPhotoAttachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const onAddPhotos = useCallback(async (picked: File[]) => {
    if (picked.length === 0) return;
    const images = filterImageFiles(picked);
    if (images.length === 0) {
      setPhotoUploadError("Only JPEG, PNG, WebP, or GIF under 5 MB each.");
      return;
    }
    const room = MAX_REQUEST_PHOTOS - attachmentsRef.current.length;
    if (room <= 0) {
      setPhotoUploadError(`You can attach up to ${MAX_REQUEST_PHOTOS} photos.`);
      return;
    }
    const batch = images.slice(0, room);
    setUploadingPhotos(true);
    setPhotoUploadError("");
    try {
      const uploaded: RequestPhotoAttachment[] = await Promise.all(
        batch.map(async (file) => {
          const url = await uploadCatalogImage(file);
          const name = file.name.trim().slice(0, 255) || "image";
          return { fileName: name, fileUrl: url, mimeType: file.type };
        }),
      );
      setAttachments((prev) => [...prev, ...uploaded]);
      if (images.length > batch.length) {
        setPhotoUploadError(
          `Only ${batch.length} photo(s) added (maximum ${MAX_REQUEST_PHOTOS} per request).`,
        );
      } else if (picked.length > images.length) {
        setPhotoUploadError("Some files were skipped (unsupported type or over 5 MB).");
      }
    } catch (err: unknown) {
      setPhotoUploadError((err as Error).message || "Upload failed.");
    } finally {
      setUploadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  useEffect(() => {
    const slug = searchParams.get("fromShowcase")?.trim();
    if (!slug) return;
    if (lastPrefillSlug.current === slug) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await apiFetch<ShowcaseForPrefill>(
          `/api/v1/catalog/products/slug/${encodeURIComponent(slug)}?currency=USD`,
          { service: "catalog" },
        );
        if (cancelled) return;
        lastPrefillSlug.current = slug;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const link = origin ? `${origin}/products/${p.slug}` : `/products/${p.slug}`;
        const head = [
          "I was inspired by this seller showcase listing (not a binding offer).",
          "",
          `Seller: ${p.seller.name}`,
          `Showcase: ${link}`,
          "",
          "What they showed:",
        ].join("\n");
        const tail = [
          "",
          "What I want (edit below — add quantity, deadlines, specs, and your expectations):",
          "- ",
        ].join("\n");
        const rawDesc = p.description.trim();
        const maxDescPart = Math.max(0, MAX_DESC - head.length - tail.length - 1);
        const descPart = rawDesc.slice(0, maxDescPart);
        const truncated = descPart.length < rawDesc.length;
        const full = `${head}\n${descPart}${truncated ? "\n…" : ""}${tail}`;
        setTitle(`Inspired by: ${p.title}`.slice(0, 200));
        setDescription(full.slice(0, MAX_DESC));
        if (p.category?.id) setCategory(p.category.id);
      } catch {
        if (!cancelled) lastPrefillSlug.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Title is required.";
    else if (title.trim().length < 5)
      next.title = "Title must be at least 5 characters.";
    if (!category) next.category = "Please select a category.";
    const qty = Math.floor(Number(quantity));
    if (!quantity.trim() || !Number.isFinite(qty) || qty < 1) {
      next.quantity = "Quantity must be at least 1.";
    }
    if (!budget) next.budget = "Price per unit is required.";
    else if (Number(budget) <= 0) next.budget = "Price per unit must be greater than 0.";
    if (!description.trim()) next.description = "Description is required.";
    else if (description.trim().length < 20)
      next.description = "Description must be at least 20 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const emailVerified = Boolean(user?.emailVerified);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setSubmitError("");
    setVerificationToken("");
    setResendingVerification(true);
    try {
      const res = await resendVerificationEmail(user.email);
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setSubmitError(e.message || "Could not send verification email.");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user.role !== "admin" && user.canBuy !== false && !emailVerified) {
      setSubmitError("Verify your email before creating buyer requests.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        categoryId: category,
        quantity: Math.floor(Number(quantity)),
        budgetMax: Number(budget),
        currency,
        isNegotiable: false,
      };
      if (deadlineLocal.trim()) {
        body.deadlineAt = new Date(deadlineLocal).toISOString();
      }
      if (location.trim()) {
        body.location = location.trim().slice(0, 150);
      }
      if (attachments.length > 0) {
        body.attachments = attachments.map((a) => ({
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          mimeType: a.mimeType,
        }));
      }

      const created = await apiFetchWithRefresh<{ id: string }>("/api/v1/requests", {
        method: "POST",
        service: "request",
        body: JSON.stringify(body),
      });

      setCreatedId(created.id);

      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as Error;
      setSubmitError(e.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    lastPrefillSlug.current = null;
    setTitle("");
    setCategory("");
    setCurrency("USD");
    setQuantity("1");
    setBudget("");
    setDeadlineLocal("");
    setLocation("");
    setDescription("");
    setErrors({});
    setSubmitted(false);
    setAttachments([]);
    setPhotoUploadError("");
    photoDragDepthRef.current = 0;
    setPhotoDropActive(false);
    if (searchParams.get("fromShowcase")?.trim()) {
      router.replace("/create-product-request");
    }
  };

  if (submitted) {
    return (
      <RoleGate
        allowedRoles={["buyer", "admin"]}
        title="Buyer request area"
        description="Sellers respond to buyer demand from the request board. To submit offers, open the seller request board instead."
        ctaHref="/browse-buyer-requests"
        ctaLabel="Browse buyer requests"
        unauthenticatedDescription="Log in as a buyer to create and publish requests."
      >
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-4xl">
              check_circle
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
            Draft saved
          </h1>
          <p className="text-slate-500 mb-2 text-lg">
            &ldquo;{title}&rdquo; is saved as a{" "}
            <span className="font-bold text-slate-800">draft</span>. Sellers
            don&apos;t see it until you publish from{" "}
            <span className="font-semibold text-slate-700">My Requests</span>.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            You can edit or delete the draft anytime. Publish when you&apos;re
            ready for offers.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Title</span>
              <span className="text-sm font-semibold text-slate-900">
                {title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Category</span>
              <span className="text-sm font-semibold text-slate-900">
                {catalogCategories.find((c) => c.id === category)?.name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Quantity</span>
              <span className="text-sm font-semibold text-slate-900">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Price per unit</span>
              <span className="text-sm font-semibold text-slate-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                }).format(Number(budget))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Currency</span>
              <span className="text-sm font-semibold text-slate-900">{currency}</span>
            </div>
            {deadlineLocal && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500 shrink-0">Deadline</span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {new Date(deadlineLocal).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
            {location.trim() && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500 shrink-0">Location</span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {location.trim()}
                </span>
              </div>
            )}
            {createdId && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Request ID</span>
                <span className="text-sm font-semibold text-slate-900">
                  {createdId}
                </span>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-slate-500 shrink-0">Photos</span>
                <span className="text-sm font-semibold text-slate-900 text-right">
                  {attachments.length} attached
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/my-requests"
              className="flex-1 bg-[#607afb] text-white py-3.5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                inventory_2
              </span>
              Open My Requests
            </Link>
            <button
              type="button"
              onClick={reset}
              className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                add
              </span>
              Post Another
            </button>
          </div>
        </div>
      </div>
      </RoleGate>
    );
  }

  if (user?.role === "buyer" && !emailVerified) {
    return (
      <RoleGate
        allowedRoles={["buyer", "admin"]}
        title="Buyer request area"
        description="Sellers respond to buyer demand from the request board. To submit offers, open the seller request board instead."
        ctaHref="/browse-buyer-requests"
        ctaLabel="Browse buyer requests"
        unauthenticatedDescription="Log in as a buyer to create and publish requests."
      >
        <div className="mx-auto flex max-w-xl flex-1 items-center px-4 py-16">
          <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl shadow-amber-100/60">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Verify your email first</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Buyer requests can only be created from verified accounts. Check your inbox for the Mollmart verification link.
            </p>
            {submitError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}
            {verificationToken ? (
              <Link className="mt-4 block break-all rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 underline" href={`/verify-email/${verificationToken}`}>
                Open local verification link
              </Link>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={resendingVerification}
                onClick={handleResendVerification}
                className="flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
              >
                {resendingVerification ? "Sending..." : "Resend verification email"}
              </button>
              <Link
                href="/profile"
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Open profile
              </Link>
            </div>
          </div>
        </div>
      </RoleGate>
    );
  }

  return (
    <RoleGate
      allowedRoles={["buyer", "admin"]}
      title="Buyer request area"
      description="Sellers respond to buyer demand from the request board. To submit offers, open the seller request board instead."
      ctaHref="/browse-buyer-requests"
      ctaLabel="Browse buyer requests"
      unauthenticatedDescription="Log in as a buyer to create and publish requests."
    >
    <div className="app-page pb-20 sm:pb-24">
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
        {/* Left Column: Branding & Instructions */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Post a Request
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Saw something you like in a seller showcase? Describe what you need and{" "}
              <span className="font-semibold text-slate-800">name your price</span> — sellers compete with offers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">
                  verified_user
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Verified Sellers</h3>
                <p className="text-sm text-slate-500">
                  Only top-rated pros can respond to your request.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">
                  forum
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Direct Negotiation</h3>
                <p className="text-sm text-slate-500">
                  Accept an offer to open a chat and agree on details directly.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative rounded-2xl overflow-hidden h-64 shadow-xl">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              alt="Collaborative workspace"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkAZceYO_8Tataijld8Y69aZktd709m9bAIOE1r_bbqhHlks3mMjhS1lToogBem56Wr7YoS7KDfAAsvrggeVxwbl9F3hKFCZk8tkaZgaGdjrJrRfxFMwgECUfl8ArektPdxQQFnkHpPHS4RGKWmEBDQrEqLIbWdE7aID735SwGtqB_u5ZnGmIRW2A1O7rRUgmdfzfWO4MF4_m_5RoPLvl7qosjddd0U5Qvp-on0CldSsSLOxoX3jMx_OJs-OKtgcTlO2cY8rosIgk"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent flex items-end p-6">
              <p className="text-white font-medium italic">
                &ldquo;Mollmart found me the perfect custom mechanical keyboard
                in under 24 hours.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-10 space-y-8"
            noValidate
          >
            {searchParams.get("fromShowcase")?.trim() ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Started from a seller showcase — edit the details and set <strong>your</strong> budget below.
              </div>
            ) : null}

            {/* Section 1: Basics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  Basic Information
                </h2>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  What are you looking for?
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 placeholder:text-slate-400 ${
                    errors.title
                      ? "border-red-400 focus:ring-2 focus:ring-red-400"
                      : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="e.g. Custom Oak Dining Table"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      error
                    </span>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      disabled={categoriesLoading}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (errors.category)
                          setErrors((p) => ({ ...p, category: undefined }));
                      }}
                      className={`w-full appearance-none px-4 py-3 rounded-xl border transition-all outline-none bg-white text-slate-900 ${
                        errors.category
                          ? "border-red-400 focus:ring-2 focus:ring-red-400"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    >
                      <option value="">{categoriesLoading ? "Loading categories…" : "Select a category"}</option>
                      {catalogCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  {errors.category && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        error
                      </span>
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Budget will be stored in this currency.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      if (errors.quantity) setErrors((p) => ({ ...p, quantity: undefined }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 ${
                      errors.quantity
                        ? "border-red-400 focus:ring-2 focus:ring-red-400"
                        : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="1"
                    min={1}
                    step={1}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.quantity}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Price per unit ({currency})
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (errors.budget)
                        setErrors((p) => ({ ...p, budget: undefined }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 ${
                      errors.budget
                        ? "border-red-400 focus:ring-2 focus:ring-red-400"
                        : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="0"
                    min={0}
                    step={0.01}
                  />
                  <p className="text-xs text-slate-400">
                    Target price for one item in the currency you selected above.
                  </p>
                  {errors.budget && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        error
                      </span>
                      {errors.budget}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Deadline{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={deadlineLocal}
                    onChange={(e) => setDeadlineLocal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400">
                    Must be in the future when you publish the request.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    City / region{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value.slice(0, 150))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Berlin, Germany"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 2: Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  Specifications
                </h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    Description / Specific Requirements
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      description.length > MAX_DESC
                        ? "text-red-500"
                        : description.length > MAX_DESC * 0.9
                          ? "text-orange-500"
                          : "text-slate-400"
                    }`}
                  >
                    {description.length}/{MAX_DESC}
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESC) {
                      setDescription(e.target.value);
                      if (errors.description)
                        setErrors((p) => ({ ...p, description: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none ${
                    errors.description
                      ? "border-red-400 focus:ring-2 focus:ring-red-400"
                      : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="Include dimensions, materials, color preferences, and any other specific details that help sellers understand your needs."
                  rows={5}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      error
                    </span>
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Reference photos{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <p className="text-xs text-slate-500">
                  Drag and drop up to {MAX_REQUEST_PHOTOS} images, or click to choose. JPEG, PNG, WebP,
                  or GIF — max 5 MB each. Images are stored securely and appear on the request board.
                </p>
                <input
                  ref={photosInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void onAddPhotos(mergeFilesFromInput(e.target.files));
                    e.target.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      photosInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    photoDragDepthRef.current += 1;
                    setPhotoDropActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    photoDragDepthRef.current -= 1;
                    if (photoDragDepthRef.current <= 0) {
                      photoDragDepthRef.current = 0;
                      setPhotoDropActive(false);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    photoDragDepthRef.current = 0;
                    setPhotoDropActive(false);
                    void onAddPhotos(mergeFilesFromInput(e.dataTransfer.files));
                  }}
                  onClick={() => photosInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    uploadingPhotos
                      ? "border-blue-300 bg-blue-50/80 text-slate-600"
                      : photoDropActive
                        ? "border-blue-500 bg-blue-50/60 text-slate-700"
                        : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-primary/50"
                  }`}
                >
                  {uploadingPhotos ? (
                    <span className="flex items-center justify-center gap-2 font-medium text-slate-700">
                      <span className="material-symbols-outlined animate-pulse text-[22px]">cloud_upload</span>
                      Uploading…
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[28px] text-slate-400">add_photo_alternate</span>
                      <span>
                        Drop images here or <span className="font-semibold text-blue-600">click to browse</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {attachments.length}/{MAX_REQUEST_PHOTOS} used
                      </span>
                    </span>
                  )}
                </div>
                {photoUploadError ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {photoUploadError}
                  </p>
                ) : null}
                {attachments.length > 0 ? (
                  <ul className="flex flex-wrap gap-3 pt-1">
                    {attachments.map((a, i) => (
                      <li
                        key={`${a.fileUrl}-${i}`}
                        className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
                      >
                        <img src={a.fileUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          disabled={uploadingPhotos}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-50"
                          aria-label="Remove photo"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachments((prev) => prev.filter((_, j) => j !== i));
                            setPhotoUploadError("");
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

            </div>

            {/* Submit */}
            <div className="pt-4">
              {submitError && (
                <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  {submitError}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting || uploadingPhotos}
                className="w-full bg-[#607afb] hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Save as draft</span>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                By posting, you agree to Mollmart&apos;s Buyer Terms of Service.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </RoleGate>
  );
}
