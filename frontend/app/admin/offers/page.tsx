'use client';

import { useCallback, useEffect, useState } from "react";
import { AdminEntityActions } from "@/components/admin/AdminEntityActions";
import { formatCatalogMoney } from "@/lib/catalog";
import { fetchAdminOffers, type AdminOfferRow } from "@/lib/admin";
import { searchInputClassName } from "@/components/ui/SearchField";

export default function AdminOffersPage() {
  const [items, setItems] = useState<AdminOfferRow[]>([]);
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
      const data = await fetchAdminOffers(page, 20, search);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load offers");
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
        <h1 className="text-2xl font-black text-[#0d1b12]">Offers</h1>
        <p className="mt-1 text-sm text-gray-600">Withdraw or delete seller offers on buyer requests.</p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search request, seller, message…" className={searchInputClassName} />
        <button type="submit" className="h-11 rounded-xl bg-[#0d1b12] px-5 text-sm font-semibold text-white">Search</button>
      </form>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[#e7f3eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Request / offer</th>
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
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No offers found.</td></tr>
            ) : (
              items.map((o) => (
                <tr key={o.id} className="align-top hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#0d1b12]">{o.requestTitle}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{o.message}</p>
                    <p className="font-mono text-[10px] text-gray-400 mt-1">{o.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.seller.name}</p>
                    <p className="text-xs text-gray-500">{o.seller.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatCatalogMoney(o.price, o.currency, 2)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase">{o.status}</span>
                    {o.isHidden ? <span className="ml-2 text-[10px] font-bold text-red-600">BLOCKED</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <AdminEntityActions targetType="offer" targetId={o.id} isHidden={o.isHidden} label={o.requestTitle} onDone={load} compact />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Page {meta.page} / {Math.max(1, meta.totalPages)} · {meta.total} offers</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
          <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
