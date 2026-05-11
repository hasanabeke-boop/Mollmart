'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithRefresh } from "@/lib/api";

type RequestItem = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: string;
  offerCount?: number;
  createdAt: string;
};

type OfferItem = {
  id: string;
  requestId: string;
  price: number;
  currency: string;
  message: string;
  status: string;
  sellerId: string;
  createdAt: string;
};

function formatBudget(request: RequestItem) {
  const currency = request.currency || "USD";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

  if (request.budgetMin && request.budgetMax) return `${fmt(request.budgetMin)} - ${fmt(request.budgetMax)}`;
  if (request.budgetMax) return fmt(request.budgetMax);
  if (request.budgetMin) return `${fmt(request.budgetMin)}+`;
  return "Negotiable";
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [offersByRequest, setOffersByRequest] = useState<Record<string, OfferItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchWithRefresh<{ items?: RequestItem[]; data?: RequestItem[] }>(
        "/api/v1/requests/me?limit=50",
        { service: "request" },
      );
      setRequests(data.items || data.data || (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const loadOffers = async (requestId: string) => {
    if (offersByRequest[requestId]) return;
    try {
      const data = await apiFetchWithRefresh<{ items?: OfferItem[]; data?: OfferItem[] }>(
        `/api/v1/offers/request/${requestId}`,
        { service: "offer" },
      );
      setOffersByRequest((prev) => ({
        ...prev,
        [requestId]: data.items || data.data || (Array.isArray(data) ? data : []),
      }));
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load offers.");
    }
  };

  const acceptOffer = async (offer: OfferItem) => {
    setAcceptingId(offer.id);
    setError("");
    try {
      await apiFetchWithRefresh(`/api/v1/offers/${offer.id}/accept`, {
        method: "POST",
        service: "offer",
      });
      await apiFetchWithRefresh("/api/v1/conversations", {
        method: "POST",
        service: "chat",
        body: JSON.stringify({ requestId: offer.requestId, offerId: offer.id }),
      });
      router.push("/chat");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to accept offer.");
    } finally {
      setAcceptingId("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Requests</h1>
          <p className="mt-1 text-slate-500">Review seller offers and open chats after accepting the right match.</p>
        </div>
        <Link
          href="/create-product-request"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#607afb] px-5 py-3 text-sm font-bold text-white"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Post Request
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">No requests yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create a request so sellers can respond with offers.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const offers = offersByRequest[request.id] || [];
            return (
              <section key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-500">
                        {request.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{request.categoryId}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{request.title}</h2>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-500">{request.description}</p>
                  </div>
                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-xs font-semibold uppercase text-slate-400">Budget</p>
                    <p className="text-lg font-black text-slate-900">{formatBudget(request)}</p>
                    <p className="mt-1 text-xs text-slate-400">{request.offerCount || 0} offers</p>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => loadOffers(request.id)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {offersByRequest[request.id] ? "Refresh offers" : "View offers"}
                  </button>
                </div>

                {offersByRequest[request.id] && (
                  <div className="mt-4 space-y-3">
                    {offers.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No offers for this request yet.</p>
                    ) : offers.map((offer) => (
                      <div key={offer.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-black text-slate-900">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: offer.currency }).format(offer.price)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{offer.message}</p>
                            <p className="mt-2 text-xs text-slate-400">Seller: {offer.sellerId}</p>
                          </div>
                          <button
                            type="button"
                            disabled={acceptingId === offer.id || offer.status === "accepted"}
                            onClick={() => acceptOffer(offer)}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-[#0d1b12] disabled:opacity-50"
                          >
                            {offer.status === "accepted" ? "Accepted" : acceptingId === offer.id ? "Accepting..." : "Accept Offer"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
