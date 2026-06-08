'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import RoleGate from "@/components/auth/RoleGate";
import { SearchField } from "@/components/ui/SearchField";
import { canUseSellerWorkspace } from "@/lib/workspace";
import { formatMoney, normalizeCurrency } from "@/lib/currency";

type RequestLead = {
  id: string;
  title: string;
  categoryId: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deadlineAt?: string | null;
  status: string;
  offerCount?: number;
};

type OfferItem = {
  id: string;
  requestId: string;
  status: string;
  price: number;
  currency: string;
  createdAt: string;
};

type ConversationItem = {
  id: string;
  status?: string;
};

function listFrom<T>(value: { items?: T[]; data?: T[] } | T[]): T[] {
  if (Array.isArray(value)) return value;
  return value.items || value.data || [];
}

function formatBudget(lead: RequestLead) {
  const currency = normalizeCurrency(lead.currency);
  const fmt = (n: number) => formatMoney(n, currency);
  const unitSuffix = " / unit";

  if (lead.budgetMin != null && lead.budgetMax != null) {
    return `${fmt(lead.budgetMin)} - ${fmt(lead.budgetMax)}${unitSuffix}`;
  }
  if (lead.budgetMax != null) return `${fmt(lead.budgetMax)}${unitSuffix}`;
  if (lead.budgetMin != null) return `${fmt(lead.budgetMin)}+${unitSuffix}`;
  return "Negotiable";
}

function formatQty(lead: RequestLead) {
  const q = Math.max(1, Math.floor(Number(lead.quantity) || 1));
  return q === 1 ? "1 item" : `${q} items`;
}

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useWorkspace();
  const sellerWorkspace = canUseSellerWorkspace(user, activeRole);
  const [requests, setRequests] = useState<RequestLead[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user || !sellerWorkspace) return;
    setLoading(true);
    setError("");
    try {
      const [requestData, offerData, conversationData] = await Promise.all([
        apiFetchWithRefresh<{ items?: RequestLead[]; data?: RequestLead[] }>(
          "/api/v1/requests?limit=20",
          { service: "request" },
        ),
        apiFetchWithRefresh<{ items?: OfferItem[]; data?: OfferItem[] }>(
          "/api/v1/offers/me?limit=50",
          { service: "offer" },
        ),
        apiFetchWithRefresh<{ items?: ConversationItem[]; data?: ConversationItem[] }>(
          "/api/v1/conversations?limit=50",
          { service: "chat" },
        ),
      ]);

      setRequests(listFrom(requestData));
      setOffers(listFrom(offerData));
      setConversations(listFrom(conversationData));
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load seller dashboard.");
      setRequests([]);
      setOffers([]);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user, sellerWorkspace]);

  useEffect(() => {
    if (authLoading || !user || !sellerWorkspace) {
      setLoading(false);
      return;
    }
    loadData();
  }, [loadData, authLoading, user, sellerWorkspace]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests.slice(0, 6);
    return requests.filter((request) =>
      `${request.title} ${request.categoryId}`.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [requests, search]);

  const acceptedOffers = offers.filter((offer) => offer.status === "accepted").length;
  const responseRate = offers.length > 0 ? Math.round((acceptedOffers / offers.length) * 100) : 0;
  const categoryCounts = requests.reduce<Record<string, number>>((acc, request) => {
    acc[request.categoryId] = (acc[request.categoryId] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title="Seller workspace"
      description="Seller Dashboard is for sellers who browse buyer demand, send offers, and track conversations. Buyers should manage their requests instead."
      ctaHref="/my-requests"
      ctaLabel="Open my requests"
      unauthenticatedDescription="Log in as a seller to view the seller dashboard."
    >
    <div className="app-page-min-height relative w-full bg-[#f5f6f8]">
      <main className="app-page-min-height flex flex-col">
        <header className="sticky top-[var(--app-header-height)] z-20 hidden h-16 w-full items-center justify-between border-b border-[#e7f3eb] bg-white/90 px-4 backdrop-blur md:flex md:px-6">
          <div className="hidden md:block">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search live requests…"
              width="narrow"
              inputClassName="h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 pl-11 pr-11 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-black">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </Link>
            <Link href="/browse-buyer-requests" className="hidden h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-black transition-transform hover:scale-105 md:flex">
              <span className="mr-2 material-symbols-outlined text-[20px]">travel_explore</span>
              Browse Requests
            </Link>
          </div>
        </header>

        <div className="app-page app-page-wide flex w-full flex-1 flex-col gap-6 sm:gap-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#0d1b12]">Seller Dashboard</h2>
              <p className="mt-1 text-gray-600">
                Live request board, submitted offers, and conversations from the backend.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="flex w-full items-center justify-center rounded-lg border border-[#e7f3eb] bg-white py-3 text-sm font-bold text-[#0d1b12] md:w-auto md:px-5"
            >
              <span className="mr-2 material-symbols-outlined">refresh</span>
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="travel_explore" iconBg="bg-green-50 text-green-700" label="Visible Requests" value={String(requests.length)} />
            <StatCard icon="local_offer" iconBg="bg-blue-50 text-blue-700" label="Offers Sent" value={String(offers.length)} />
            <StatCard icon="chat" iconBg="bg-purple-50 text-purple-700" label="Active Chats" value={String(conversations.length)} />
            <StatCard icon="speed" iconBg="bg-orange-50 text-orange-700" label="Accepted Offers" value={`${responseRate}%`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  <h3 className="text-lg font-bold text-[#0d1b12]">Demand Signals</h3>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                {topCategories.length === 0 ? (
                  <p className="text-sm text-gray-500">No published requests are available for this seller account yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topCategories.map(([name, count], index) => (
                      <Link
                        key={name}
                        href={`/browse-buyer-requests?category=${encodeURIComponent(name)}`}
                        className="group flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-gray-400 shadow-sm">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-[#0d1b12]">{name}</span>
                        </div>
                        <span className="text-xs font-bold text-green-600">{count} live</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-2 rounded-lg bg-primary/10 p-4">
                  <p className="text-xs font-medium text-gray-800">
                    Tip: offers with clear pricing and availability are easier for buyers to compare.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <h3 className="text-lg font-bold text-[#0d1b12]">Matching Requests</h3>
                <Link href="/browse-buyer-requests" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                  View All
                </Link>
              </div>
              <div className="app-table-wrap">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Request</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Qty</th>
                      <th className="px-6 py-4 font-medium">Price / unit</th>
                      <th className="px-6 py-4 font-medium">Offers</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                          </td>
                        </tr>
                      ))
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                          No requests found.
                        </td>
                      </tr>
                    ) : filteredRequests.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#0d1b12]">{lead.title}</p>
                          <p className="text-xs text-gray-500">{lead.id}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{lead.categoryId}</td>
                        <td className="px-6 py-4 text-gray-600">{formatQty(lead)}</td>
                        <td className="px-6 py-4 font-medium text-[#0d1b12]">{formatBudget(lead)}</td>
                        <td className="px-6 py-4 text-gray-600">{lead.offerCount || 0}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#e7f3eb] p-4 text-center">
                <Link href="/browse-buyer-requests" className="text-sm font-bold text-green-700 hover:text-green-800">
                  Open Request Board
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </RoleGate>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="mt-1 text-2xl font-bold text-[#0d1b12]">{value}</h3>
      </div>
    </div>
  );
}
