'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminDatabaseStats,
  fetchAdminPlatformReport,
  type AdminPlatformReport,
  type DatabaseStats,
} from "@/lib/admin";

export default function AdminMonitoringPage() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [report, setReport] = useState<AdminPlatformReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [stats, overview] = await Promise.all([
        fetchAdminDatabaseStats(),
        fetchAdminPlatformReport(),
      ]);
      setDbStats(stats);
      setReport(overview);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load monitoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedTables = [...(dbStats?.tables ?? [])].sort(
    (a, b) => b.rowEstimate - a.rowEstimate,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Monitoring</h1>
          <p className="mt-1 text-[#4c9a66]">
            Database health, storage usage, and live platform counters.
          </p>
          {dbStats?.checkedAt ? (
            <p className="mt-1 text-xs text-gray-400">
              Checked {new Date(dbStats.checkedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e7f3eb] bg-white px-4 py-2 text-sm font-semibold text-[#0d1b12] shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${refreshing ? "animate-spin" : ""}`}>
            refresh
          </span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-xl border border-[#e7f3eb] bg-white animate-pulse" />
          <div className="h-64 rounded-xl border border-[#e7f3eb] bg-white animate-pulse" />
        </div>
      ) : dbStats && report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Database</p>
              <p className="mt-2 text-lg font-bold text-[#0d1b12]">{dbStats.databaseName}</p>
              <p className="text-sm text-gray-500">{dbStats.databaseSizeHuman}</p>
            </div>
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Users</p>
              <p className="mt-2 text-2xl font-bold text-[#0d1b12]">{dbStats.totals.users}</p>
              <p className="text-sm text-gray-500">{report.platform.activeUsers} active</p>
            </div>
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Orders</p>
              <p className="mt-2 text-2xl font-bold text-[#0d1b12]">
                {dbStats.totals.catalogOrders + dbStats.totals.requestDealOrders}
              </p>
              <p className="text-sm text-gray-500">
                {report.platform.openCatalogOrders + report.platform.openRequestDealOrders} open
              </p>
            </div>
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Content</p>
              <p className="mt-2 text-2xl font-bold text-[#0d1b12]">
                {dbStats.totals.requests + dbStats.totals.catalogProducts}
              </p>
              <p className="text-sm text-gray-500">
                {dbStats.totals.requests} requests · {dbStats.totals.catalogProducts} products
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Render database maintenance</p>
            <p className="mt-1 text-amber-800">
              To inspect counts from Render Shell:{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">npm run db:status:prod</code>
              . To wipe application data (keeps schema, re-seeds categories):{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
                DB_WIPE_CONFIRM=WIPE_MOLLMART_DATA npm run db:wipe:prod
              </code>
              . R2 uploads are not deleted by the wipe command.
            </p>
          </div>

          <div className="rounded-xl border border-[#e7f3eb] bg-white shadow-sm overflow-x-auto">
            <div className="border-b border-[#e7f3eb] px-5 py-4">
              <h2 className="text-sm font-bold text-[#0d1b12]">Table row estimates</h2>
              <p className="text-xs text-gray-500 mt-0.5">From PostgreSQL pg_stat_user_tables (approximate live rows)</p>
            </div>
            <table className="w-full text-left text-sm min-w-[480px]">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Table</th>
                  <th className="px-5 py-3 text-right">Rows (est.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTables.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-gray-500">
                      No table statistics available.
                    </td>
                  </tr>
                ) : (
                  sortedTables.map((row) => (
                    <tr key={row.table} className="hover:bg-gray-50/80">
                      <td className="px-5 py-2.5 font-mono text-xs text-[#0d1b12]">{row.table}</td>
                      <td className="px-5 py-2.5 text-right font-semibold">{row.rowEstimate.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e7f3eb] bg-white px-4 py-2 text-sm font-semibold text-[#0d1b12] shadow-sm hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              Back to dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-[#e7f3eb] bg-white px-4 py-2 text-sm font-semibold text-[#0d1b12] shadow-sm hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Manage orders
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
