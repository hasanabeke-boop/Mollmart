'use client';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";

type ApiCategory = { id: string; name: string; slug: string };

type ShowcaseForPrefill = {
  slug: string;
  title: string;
  description: string;
  category: { id: string; name: string; slug: string } | null;
  seller: { id: string; name: string };
};

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "RUB", label: "RUB — Russian Ruble" },
  { code: "KZT", label: "KZT — Kazakhstani Tenge" },
];

const MAX_DESC = 1000;
const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FormErrors = {
  title?: string;
  category?: string;
  budget?: string;
  description?: string;
};

type ImagePreview = {
  file: File;
  url: string;
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
  const [catalogCategories, setCatalogCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const lastPrefillSlug = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!budget) next.budget = "Budget is required.";
    else if (Number(budget) <= 0) next.budget = "Budget must be greater than 0.";
    if (!description.trim()) next.description = "Description is required.";
    else if (description.trim().length < 20)
      next.description = "Description must be at least 20 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        categoryId: category,
        budgetMax: Number(budget),
        currency,
        isNegotiable: true,
      };
      if (deadlineLocal.trim()) {
        body.deadlineAt = new Date(deadlineLocal).toISOString();
      }
      if (location.trim()) {
        body.location = location.trim().slice(0, 150);
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

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const remaining = MAX_FILES - images.length;
      if (remaining <= 0) return;

      const newImages: ImagePreview[] = [];
      for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
        const file = fileList[i];
        if (file.size > MAX_FILE_SIZE) continue;
        if (!file.type.startsWith("image/")) continue;
        newImages.push({ file, url: URL.createObjectURL(file) });
      }
      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length],
  );

  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const reset = () => {
    lastPrefillSlug.current = null;
    setTitle("");
    setCategory("");
    setCurrency("USD");
    setBudget("");
    setDeadlineLocal("");
    setLocation("");
    setDescription("");
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setErrors({});
    setSubmitted(false);
    if (searchParams.get("fromShowcase")?.trim()) {
      router.replace("/create-product-request");
    }
  };

  if (submitted) {
    return (
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
              <span className="text-sm text-slate-500">Budget</span>
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
            {images.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Images</span>
                <span className="text-sm font-semibold text-slate-900">
                  {images.length} attached
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
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Branding & Instructions */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
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
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Budget / target price ({currency})
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
                    Enter the amount in the currency you selected above.
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
                  Upload Reference Images{" "}
                  <span className="text-slate-400 font-normal">
                    (up to {MAX_FILES})
                  </span>
                </label>

                {images.length > 0 && (
                  <div className="flex gap-3 flex-wrap mb-3">
                    {images.map((img, i) => (
                      <div
                        key={img.url}
                        className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200"
                      >
                        <img
                          src={img.url}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-white">
                            delete
                          </span>
                        </button>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {(img.file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < MAX_FILES && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`group relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                        isDragging
                          ? "bg-blue-100"
                          : "bg-slate-50 group-hover:bg-blue-100"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined ${
                          isDragging
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-blue-600"
                        }`}
                      >
                        cloud_upload
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      {isDragging
                        ? "Drop your images here"
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG or WEBP (max. 10MB each)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
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
                disabled={submitting}
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
  );
}
