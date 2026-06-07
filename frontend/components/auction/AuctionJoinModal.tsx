"use client";



import Link from "next/link";

import { useState } from "react";

import { apiFetchWithRefresh } from "@/lib/api";

import { formatMoney, normalizeCurrency } from "@/lib/currency";

import AuctionRulesHelp, { useAuctionRules } from "@/components/auction/AuctionRulesHelp";



type RequestLike = {

  id: string;

  title: string;

  currency: string;

  budgetMax: number;

  quantity: number;

};



export default function AuctionJoinModal({

  request,

  onClose,

}: {

  request: RequestLike;

  onClose: () => void;

}) {

  const { rules } = useAuctionRules();

  const minSellers = rules?.minParticipants ?? 3;

  const currency = normalizeCurrency(request.currency);

  const [startPrice, setStartPrice] = useState(

    request.budgetMax > 0 ? String(request.budgetMax) : "",

  );

  const [floorPrice, setFloorPrice] = useState("");

  const [deliveryDays, setDeliveryDays] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [done, setDone] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);



  const submit = async () => {

    const start = Number(startPrice);

    const floor = Number(floorPrice);

    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(floor) || floor <= 0) {

      setError("Enter valid starting and floor prices.");

      return;

    }

    if (floor > start) {

      setError("Floor cannot exceed starting price.");

      return;

    }



    setSubmitting(true);

    setError("");

    try {

      const data = await apiFetchWithRefresh<{ id: string }>(

        `/api/v1/auctions/request/${request.id}/participate`,

        {

          method: "POST",

          service: "auction",

          body: JSON.stringify({

            startPrice: start,

            floorPrice: floor,

            deliveryDays: deliveryDays ? parseInt(deliveryDays, 10) : undefined,

            message: message.trim() || undefined,

          }),

        },

      );

      setSessionId(data.id);

      setDone(true);

    } catch (err: unknown) {

      setError((err as Error).message || "Could not join auction.");

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"

      onClick={onClose}

    >

      <div

        className="w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl"

        onClick={(e) => e.stopPropagation()}

      >

        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">

          <div>

            <h3 className="text-lg font-bold text-[var(--foreground)]">Join reverse auction</h3>

            <p className="text-xs text-[var(--text-muted)]">{request.title}</p>

          </div>

          <div className="flex items-center gap-2">

            <AuctionRulesHelp />

            <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--foreground)]">

              <span className="material-symbols-outlined">close</span>

            </button>

          </div>

        </div>



        {done ? (

          <div className="p-8 text-center">

            <span className="material-symbols-outlined mb-3 text-5xl text-primary">gavel</span>

            <p className="font-semibold text-[var(--foreground)]">You&apos;re registered!</p>

            <p className="mt-2 text-sm text-[var(--text-muted)]">

              Trading starts automatically when {minSellers} sellers have joined. Watch progress in

              Active auctions.

            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">

              <Link

                href="/seller/auctions"

                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-[#0d1b12]"

              >

                Active auctions

              </Link>

              {sessionId && (

                <Link

                  href={`/auctions/${request.id}`}

                  className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-semibold"

                >

                  View auction

                </Link>

              )}

            </div>

          </div>

        ) : (

          <div className="space-y-4 p-6">

            <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">

              Platform rules apply: fixed round timer, price steps, and minimum {minSellers}{" "}

              sellers. You can run multiple auctions in separate tabs.

            </p>

            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block">

                <span className="text-xs font-medium text-[var(--text-muted)]">Starting price ({currency})</span>

                <input

                  type="number"

                  min={0}

                  step="0.01"

                  value={startPrice}

                  onChange={(e) => setStartPrice(e.target.value)}

                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"

                />

              </label>

              <label className="block">

                <span className="text-xs font-medium text-[var(--text-muted)]">Floor price ({currency})</span>

                <input

                  type="number"

                  min={0}

                  step="0.01"

                  value={floorPrice}

                  onChange={(e) => setFloorPrice(e.target.value)}

                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"

                />

              </label>

            </div>

            {request.budgetMax > 0 && startPrice && (

              <p className="text-xs text-[var(--text-muted)]">

                Buyer budget up to {formatMoney(request.budgetMax, currency)} · qty {request.quantity}

              </p>

            )}

            <label className="block">

              <span className="text-xs font-medium text-[var(--text-muted)]">Delivery (days, optional)</span>

              <input

                type="number"

                min={1}

                value={deliveryDays}

                onChange={(e) => setDeliveryDays(e.target.value)}

                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"

              />

            </label>

            <label className="block">

              <span className="text-xs font-medium text-[var(--text-muted)]">Note (optional)</span>

              <textarea

                rows={2}

                value={message}

                onChange={(e) => setMessage(e.target.value)}

                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"

              />

            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button

              type="button"

              disabled={submitting}

              onClick={() => void submit()}

              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0d1b12] hover:opacity-90 disabled:opacity-50"

            >

              {submitting ? "Joining…" : "Join auction"}

            </button>

          </div>

        )}

      </div>

    </div>

  );

}

