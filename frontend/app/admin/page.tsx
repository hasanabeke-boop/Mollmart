'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchAdminPlatformReport, type AdminPlatformReport } from "@/lib/admin";

type KpiItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number | string;
  subtitle: string;
  href: string;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminPlatformReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const report = await fetchAdminPlatformReport();
      setData(report);
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to load platform report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const p = data?.platform;
  const r = data?.recent;
  const m = data?.moderation;

  const kpis: KpiItem[] = data
    ? [
        {
          icon: "group",
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
          title: "Total Users",
          value: p!.totalUsers,
          subtitle: `${p!.activeUsers} active · ${p!.blockedUsers} blocked · +${r!.usersLast7Days} (7d)`,
          href: "/admin/users",
        },
        {
          icon: "description",
          iconBg: "bg-orange-50",
          iconColor: "text-orange-600",
          title: "Buyer Requests",
          value: p!.totalRequests,
          subtitle: `${p!.publishedRequests} published · +${r!.requestsLast7Days} (7d)`,
          href: "/admin/requests",
        },
        {
          icon: "inventory_2",
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
          title: "Catalog Products",
          value: p!.catalogProducts,
          subtitle: `${p!.publishedProducts} published · ${p!.totalOffers} offers`,
          href: "/admin/orders",
        },
        {
          icon: "receipt_long",
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
          title: "Orders",
          value: p!.catalogOrders + p!.requestDealOrders,
          subtitle: `${p!.openCatalogOrders + p!.openRequestDealOrders} open · +${r!.catalogOrdersLast7Days + r!.requestDealOrdersLast7Days} (7d)`,
          href: "/admin/orders",
        },
        {
          icon: "gavel",
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
          title: "Moderation",
          value: m!.openCases + m!.inReviewCases,
          subtitle: `${data.flags.active} active flags · ${m!.resolvedCases} resolved`,
          href: "/admin/moderation",
        },
        {
          icon: "monitoring",
          iconBg: "bg-slate-50",
          iconColor: "text-slate-600",
          title: "Conversations",
          value: p!.conversations,
          subtitle: `${p!.notifications} notifications · ${data.categories.active} active categories`,
          href: "/admin/monitoring",
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Dashboard</h1>
          <p className="mt-1 text-[#4c9a66]">Platform overview, activity, and quick actions.</p>
          {data?.checkedAt ? (
            <p className="mt-1 text-xs text-gray-400">
              Last updated {new Date(data.checkedAt).toLocaleString()}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-[#e7f3eb] bg-white shadow-sm animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <Link
                key={kpi.title}
                href={kpi.href}
                className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                    <span className="material-symbols-outlined">{kpi.icon}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-400 transition-colors">
                    arrow_forward
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-[#4c9a66]">{kpi.title}</p>
                  <h3 className="mt-1 text-2xl font-bold text-[#0d1b12]">{kpi.value}</h3>
                  <p className="mt-1 text-xs text-gray-400">{kpi.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#4c9a66]">User breakdown</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-gray-500">Buyers</dt><dd className="font-bold text-[#0d1b12]">{p!.buyers}</dd></div>
                <div><dt className="text-gray-500">Sellers</dt><dd className="font-bold text-[#0d1b12]">{p!.sellers}</dd></div>
                <div><dt className="text-gray-500">Admins</dt><dd className="font-bold text-[#0d1b12]">{p!.admins}</dd></div>
                <div><dt className="text-gray-500">Suspended</dt><dd className="font-bold text-[#0d1b12]">{p!.suspendedUsers}</dd></div>
              </dl>
            </div>
            <div className="rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#4c9a66]">Completed orders</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Shop orders</dt>
                  <dd className="font-bold text-[#0d1b12]">{data.revenue.completedCatalogOrders}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Request deals</dt>
                  <dd className="font-bold text-[#0d1b12]">{data.revenue.completedRequestDealOrders}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Flagged requests</dt>
                  <dd className="font-bold text-[#0d1b12]">{data.requests.flagged}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Dismissed cases</dt>
                  <dd className="font-bold text-[#0d1b12]">{m!.dismissedCases}</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/monitoring"
          className="flex items-center gap-4 rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <span className="material-symbols-outlined text-2xl">database</span>
          </div>
          <div>
            <p className="font-bold text-[#0d1b12]">Monitoring</p>
            <p className="text-xs text-gray-500">Database size and table counts</p>
          </div>
        </Link>
        <Link
          href="/admin/categories"
          className="flex items-center gap-4 rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined text-2xl">add_circle</span>
          </div>
          <div>
            <p className="font-bold text-[#0d1b12]">Manage Categories</p>
            <p className="text-xs text-gray-500">Add, edit, or deactivate categories</p>
          </div>
        </Link>
        <Link
          href="/admin/moderation"
          className="flex items-center gap-4 rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <span className="material-symbols-outlined text-2xl">report</span>
          </div>
          <div>
            <p className="font-bold text-[#0d1b12]">Review Cases</p>
            <p className="text-xs text-gray-500">Handle flagged content and disputes</p>
          </div>
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-4 rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <span className="material-symbols-outlined text-2xl">manage_accounts</span>
          </div>
          <div>
            <p className="font-bold text-[#0d1b12]">Manage Users</p>
            <p className="text-xs text-gray-500">Roles, sessions, block and delete</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
