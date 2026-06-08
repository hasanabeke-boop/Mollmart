'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";

type DashboardSummary = {
  users: { blocked: number; flagged: number };
  requests: { flagged: number; hidden: number };
  offers: { flagged: number; hidden: number };
  flags: { total: number; active: number };
  moderation: { openCases: number; inReviewCases: number; resolvedCases: number };
  categories: { total: number; active: number };
};

const EMPTY: DashboardSummary = {
  users: { blocked: 0, flagged: 0 },
  requests: { flagged: 0, hidden: 0 },
  offers: { flagged: 0, hidden: 0 },
  flags: { total: 0, active: 0 },
  moderation: { openCases: 0, inReviewCases: 0, resolvedCases: 0 },
  categories: { total: 0, active: 0 },
};

type KpiItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number;
  subtitle: string;
  href: string;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await apiFetchWithRefresh<DashboardSummary>(
        "/api/v1/admin/dashboard/summary",
        { service: "admin" },
      );
      setData(d);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis: KpiItem[] = [
    {
      icon: "group",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      title: "Blocked Users",
      value: data.users.blocked,
      subtitle: `${data.users.flagged} flagged`,
      href: "/admin/users",
    },
    {
      icon: "description",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      title: "Flagged Requests",
      value: data.requests.flagged,
      subtitle: `${data.requests.hidden} hidden`,
      href: "/admin/moderation",
    },
    {
      icon: "local_offer",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      title: "Flagged Offers",
      value: data.offers.flagged,
      subtitle: `${data.offers.hidden} hidden`,
      href: "/admin/moderation",
    },
    {
      icon: "flag",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      title: "Active Flags",
      value: data.flags.active,
      subtitle: `${data.flags.total} total`,
      href: "/admin/moderation",
    },
    {
      icon: "gavel",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Open Cases",
      value: data.moderation.openCases,
      subtitle: `${data.moderation.inReviewCases} in review, ${data.moderation.resolvedCases} resolved`,
      href: "/admin/moderation",
    },
    {
      icon: "category",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      title: "Categories",
      value: data.categories.total,
      subtitle: `${data.categories.active} active`,
      href: "/admin/categories",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Dashboard</h1>
        <p className="mt-1 text-[#4c9a66]">Platform overview and quick actions.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-[#e7f3eb] bg-white shadow-sm animate-pulse" />
          ))}
        </div>
      ) : (
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-xs text-gray-500">Block, unblock, and review users</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
