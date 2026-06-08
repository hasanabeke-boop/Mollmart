'use client';

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { searchInputClassName } from "@/components/ui/SearchField";
import { deleteAdminRequest, fetchAdminRequests, type AdminRequestRow } from "@/lib/admin";

export default function AdminRequestsPage() {
  const [items, setItems] = useState<AdminRequestRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminRequestRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminRequests(page, 20, search);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAdminRequest(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0d1b12]">Buyer requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Permanently remove spam or invalid requests. Linked offers, chats, and deal orders are removed with the
          request.
        </p>
      </div>

      <form
        className="app-search-form mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[var(--text-muted)]">
            search
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, id, buyer email…"
            type="search"
            className={searchInputClassName}
          />
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-[#0d1b12] px-5 text-sm font-semibold text-white hover:opacity-90"
        >
          Search
        </button>
      </form>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[#e7f3eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Offers</th>
              <th className="px-4 py-3">Deals</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No requests found.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="align-top hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0d1b12]">{r.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-gray-500 break-all">{r.id}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.buyer.name}</p>
                    <p className="text-xs text-gray-500">{r.buyer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">{r.status}</span>
                  </td>
                  <td className="px-4 py-3">{r.offersCount}</td>
                  <td className="px-4 py-3">{r.dealOrdersCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {meta.page} / {Math.max(1, meta.totalPages)} · {meta.total} requests
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget != null}
        title="Delete this request?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and all related offers, conversations, and deal orders will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={runDelete}
      />
    </div>
  );
}
