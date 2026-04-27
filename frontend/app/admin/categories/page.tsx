'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; category: Category };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const load = useCallback(async () => {
    try {
      const data = await apiFetchWithRefresh<Category[]>("/api/v1/admin/categories", {
        service: "admin",
      });
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setModal({ mode: "closed" });
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Categories</h1>
          <p className="mt-1 text-[#4c9a66]">Manage product categories for the marketplace.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors self-start"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Category
        </button>
      </div>

      <div className="rounded-xl border border-[#e7f3eb] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-[#e7f3eb]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Name</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Slug</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Parent</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3eb]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  No categories yet. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const parent = categories.find((c) => c.id === cat.parentId);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#0d1b12]">{cat.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{parent?.name || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        cat.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", category: cat })}
                        className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal.mode !== "closed" && (
        <CategoryModal
          mode={modal.mode}
          category={modal.mode === "edit" ? modal.category : undefined}
          categories={categories}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function CategoryModal({
  mode,
  category,
  categories,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  category?: Category;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [parentId, setParentId] = useState(category?.parentId || "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (slug.trim().length < 2) { setError("Slug must be at least 2 characters."); return; }

    setSaving(true);
    try {
      if (mode === "create") {
        await apiFetchWithRefresh("/api/v1/admin/categories", {
          method: "POST",
          service: "admin",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId || undefined,
            isActive,
          }),
        });
      } else {
        await apiFetchWithRefresh(`/api/v1/admin/categories/${category!.id}`, {
          method: "PATCH",
          service: "admin",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId || "",
            isActive,
          }),
        });
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#0d1b12]">
            {mode === "create" ? "Add Category" : "Edit Category"}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm"
              placeholder="e.g. Electronics"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm font-mono"
              placeholder="e.g. electronics"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Parent Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm bg-white"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                isActive ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-300"
              }`}
            >
              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
