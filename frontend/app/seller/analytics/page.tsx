'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import KpiCard from "../../../components/KpiCard";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import RoleGate from "@/components/auth/RoleGate";
import { canUseSellerWorkspace } from "@/lib/workspace";

type OfferItem = {
  id: string;
  requestId: string;
  status: string;
  price: number;
  currency: string;
  createdAt: string;
};

type RequestItem = {
  id: string;
  categoryId: string;
};

type ConversationItem = {
  id: string;
  status?: string;
};

type ApiCatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

function listFrom<T>(value: { items?: T[]; data?: T[] } | T[]): T[] {
  if (Array.isArray(value)) return value;
  return value.items || value.data || [];
}

export default function SellerAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useWorkspace();
  const sellerWorkspace = canUseSellerWorkspace(user, activeRole);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<ApiCatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!sellerWorkspace) return;
    setLoading(true);
    setError("");
    try {
      const [offerData, requestData, conversationData, categoryData] = await Promise.all([
        apiFetchWithRefresh<{ items?: OfferItem[]; data?: OfferItem[] }>(
          "/api/v1/offers/me?limit=100",
          { service: "offer" },
        ),
        apiFetchWithRefresh<{ items?: RequestItem[]; data?: RequestItem[] }>(
          "/api/v1/requests?limit=100",
          { service: "request" },
        ),
        apiFetchWithRefresh<{ items?: ConversationItem[]; data?: ConversationItem[] }>(
          "/api/v1/conversations?limit=100",
          { service: "chat" },
        ),
        apiFetch<ApiCatalogCategory[]>("/api/v1/catalog/categories", { service: "catalog" }).catch(() => []),
      ]);

      setOffers(listFrom(offerData));
      setRequests(listFrom(requestData));
      setConversations(listFrom(conversationData));
      setCatalogCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load analytics.");
      setOffers([]);
      setRequests([]);
      setConversations([]);
      setCatalogCategories([]);
    } finally {
      setLoading(false);
    }
  }, [sellerWorkspace]);

  useEffect(() => {
    if (authLoading || !sellerWorkspace) {
      setLoading(false);
      return;
    }
    loadData();
  }, [loadData, authLoading, sellerWorkspace]);

  const acceptedOffers = offers.filter((offer) => offer.status === "accepted").length;
  const activeConversations = conversations.filter((conversation) => conversation.status !== "closed").length;
  const acceptanceRate = offers.length > 0 ? Math.round((acceptedOffers / offers.length) * 100) : 0;

  const offersByDay = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: 0,
      };
    });

    const byKey = new Map(days.map((day) => [day.key, day]));
    offers.forEach((offer) => {
      const key = new Date(offer.createdAt).toISOString().slice(0, 10);
      const day = byKey.get(key);
      if (day) day.value += 1;
    });
    return days;
  }, [offers]);

  const categoryRows = useMemo(() => {
    const ORPHAN_KEY = "__orphan__";
    const requestIdToCategory = new Map(requests.map((r) => [r.id, r.categoryId]));

    const labelFor = (categoryId: string) => {
      if (categoryId === ORPHAN_KEY) return "Other";
      const row = catalogCategories.find((c) => c.id === categoryId || c.slug === categoryId);
      return row?.name?.trim() || categoryId;
    };

    const byCategory = new Map<string, { categoryId: string; label: string; requests: number; offers: number }>();

    for (const r of requests) {
      const cid = r.categoryId;
      const prev = byCategory.get(cid);
      byCategory.set(cid, {
        categoryId: cid,
        label: labelFor(cid),
        requests: (prev?.requests ?? 0) + 1,
        offers: prev?.offers ?? 0,
      });
    }

    for (const o of offers) {
      const cid = requestIdToCategory.get(o.requestId) ?? ORPHAN_KEY;
      const prev =
        byCategory.get(cid) ??
        { categoryId: cid, label: labelFor(cid), requests: 0, offers: 0 };
      byCategory.set(cid, { ...prev, offers: prev.offers + 1 });
    }

    return Array.from(byCategory.values())
      .sort((a, b) => b.offers - a.offers || b.requests - a.requests)
      .slice(0, 8);
  }, [offers, requests, catalogCategories]);

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title="Seller analytics"
      description="Seller Analytics is for sellers tracking offers, accepted matches, and conversations. Buyers should use My Requests to compare offers."
      ctaHref="/my-requests"
      ctaLabel="Open my requests"
      unauthenticatedDescription="Log in as a seller to view analytics."
    >
    <div className="app-page-min-height relative w-full bg-[#f5f6f8]">
      <main className="app-page app-page-wide flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#0d1b12]">
              Seller Analytics
            </h2>
            <p className="text-[#4c9a66] text-base">
              Real metrics from offers, request board visibility, and conversations.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e7f3eb] bg-white hover:bg-[#f5f6f8] text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Refresh
            </button>
            <Link
              href="/browse-buyer-requests"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-[#0fd650] text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              Find Requests
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="travel_explore" title="Visible Requests" value={loading ? "..." : String(requests.length)} delta="live" positive />
          <KpiCard icon="local_offer" title="Offers Sent" value={loading ? "..." : String(offers.length)} delta="from API" positive />
          <KpiCard icon="chat" title="Chats Opened" value={loading ? "..." : String(activeConversations)} delta="active" positive />
          <KpiCard icon="speed" title="Offer Acceptance" value={loading ? "..." : `${acceptanceRate}%`} delta={`${acceptedOffers} accepted`} positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b12]">Offer Activity</h3>
                <p className="text-sm text-[#4c9a66]">Offers submitted during the last 7 days.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary" />
                <span className="text-sm font-medium text-[#0d1b12]">Offers Sent</span>
              </div>
            </div>
            <div className="space-y-4">
              {offersByDay.map((point) => (
                <div key={point.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#0d1b12] font-medium">{point.label}</span>
                    <span className="text-[#4c9a66]">{point.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#e7f3eb] overflow-hidden">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(point.value * 20, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-black to-[#053f18] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">query_stats</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">auto_graph</span>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Request Pulse
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">
                {requests.length > 0 ? `${requests.length} open requests are available` : "No live request signal yet"}
              </h4>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                This card is derived from the request board and your offer history, not mock analytics.
              </p>
              <Link href="/browse-buyer-requests" className="block w-full py-2.5 rounded-lg bg-primary hover:bg-white text-black font-bold text-sm transition-colors text-center">
                View Matching Requests
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7f3eb] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0d1b12]">Category Match Performance</h3>
              <Link href="/browse-buyer-requests" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="app-table-wrap">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead className="bg-[#f5f6f8]">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Category</th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">Requests</th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">Offers</th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-center">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7f3eb]">
                  {categoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 px-6 text-center text-sm text-[#4c9a66]">
                        No category activity yet.
                      </td>
                    </tr>
                  ) : categoryRows.map((row) => (
                    <tr key={row.categoryId} className="hover:bg-[#f5f6f8] transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-[#0d1b12]">{row.label}</td>
                      <td className="py-4 px-6 text-sm text-right text-[#4c9a66]">{row.requests}</td>
                      <td className="py-4 px-6 text-sm text-right text-[#4c9a66]">{row.offers}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row.requests > 0 ? `${Math.round((row.offers / row.requests) * 100)}%` : "0%"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-6">Conversation Outcomes</h3>
            <div className="space-y-4 text-sm">
              <InsightRow label="Offers leading to accepted match" value={`${acceptanceRate}%`} colorClass="bg-primary" />
              <InsightRow label="Active conversations" value={String(activeConversations)} colorClass="bg-[#053f18]" />
              <InsightRow label="Requests currently visible" value={String(requests.length)} colorClass="bg-[#e7f3eb]" />
              <div className="pt-4 border-t border-[#e7f3eb] mt-4 text-xs text-[#4c9a66]">
                <span className="font-bold text-primary">Insight:</span> These numbers update from the database when you refresh.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </RoleGate>
  );
}

function InsightRow({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`size-3 rounded-full ${colorClass}`} />
        <span className="font-medium text-[#0d1b12]">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}
