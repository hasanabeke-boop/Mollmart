'use client';

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

const CATEGORIES = [
  { value: "home-furniture", label: "Home & Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "collectibles", label: "Collectibles" },
  { value: "services", label: "Services" },
  { value: "sustainability", label: "Sustainability" },
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
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
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
    setTitle("");
    setCategory("");
    setBudget("");
    setDescription("");
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setErrors({});
    setSubmitted(false);
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
            Request Posted!
          </h1>
          <p className="text-slate-500 mb-2 text-lg">
            Your request for{" "}
            <span className="font-bold text-slate-800">
              &ldquo;{title}&rdquo;
            </span>{" "}
            is now live.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Verified sellers will start sending you offers. You&apos;ll get a
            notification when someone responds.
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
                {CATEGORIES.find((c) => c.value === category)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Budget</span>
              <span className="text-sm font-semibold text-slate-900">
                ${Number(budget).toLocaleString()}
              </span>
            </div>
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
              href="/browse-buyer-requests"
              className="flex-1 bg-[#607afb] text-white py-3.5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                visibility
              </span>
              Browse Requests
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
              Can&apos;t find what you&apos;re looking for? Describe your ideal
              product and let our curated sellers bring it to you.
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
                  payments
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Secure Payments</h3>
                <p className="text-sm text-slate-500">
                  Funds are held in escrow until you&apos;re satisfied.
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
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
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
                    Your Budget / Target Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => {
                        setBudget(e.target.value);
                        if (errors.budget)
                          setErrors((p) => ({ ...p, budget: undefined }));
                      }}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border transition-all outline-none text-slate-900 ${
                        errors.budget
                          ? "border-red-400 focus:ring-2 focus:ring-red-400"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
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
              <button
                type="submit"
                className="w-full bg-[#607afb] hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Post Request</span>
                <span className="material-symbols-outlined text-[20px]">
                  send
                </span>
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
