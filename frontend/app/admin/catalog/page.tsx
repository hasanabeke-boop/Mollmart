'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminEntityActions } from "@/components/admin/AdminEntityActions";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchAdminCatalogProducts, type AdminCatalogProductRow } from "@/lib/admin";
import { searchInputClassName } from "@/components/ui/SearchField";

export default function AdminCatalogPage() {
  const [items, setItems] = useState<AdminCatalogProductRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCatalogProducts(page, 20, search);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0d1b12]">Catalog products</h1>
        <p className="mt-1 text-sm text-gray-600">Block (archive) or permanently delete shop listings.</p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, slug, seller…"
          className={searchInputClassName}
        />
        <button type="submit" className="h-11 rounded-xl bg-[#0d1b12] px-5 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[#e7f3eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No products found.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="align-top hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover bg-gray-100" />
                      <div>
                        <p className="font-semibold text-[#0d1b12]">{p.title}</p>
                        <Link href={`/products/${p.slug}`} target="_blank" className="text-xs text-red-600 hover:underline">
                          /products/{p.slug}
                        </Link>
                        <p className="font-mono text-[10px] text-gray-400 mt-0.5">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.seller.name}</p>
                    <p className="text-xs text-gray-500">{p.seller.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatCatalogMoney(p.price, p.currency, 2)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase">{p.status}</span>
                    {p.isHidden ? <span className="ml-2 text-[10px] font-bold text-red-600">BLOCKED</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <AdminEntityActions
                      targetType="catalog_product"
                      targetId={p.id}
                      isHidden={p.isHidden}
                      label={p.title}
                      onDone={load}
                      compact
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Page {meta.page} / {Math.max(1, meta.totalPages)} · {meta.total} products</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
          <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
