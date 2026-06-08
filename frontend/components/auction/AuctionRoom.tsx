"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import type { AuctionSessionView } from "@/lib/auctionTypes";
import { useAuctionSession, useAuctionTick } from "@/hooks/useAuctionStream";
import AuctionRulesHelp from "@/components/auction/AuctionRulesHelp";

type Props = {
  sessionId: string;
  mode: "seller" | "buyer" | "spectator";
  compact?: boolean;
  onSessionLoaded?: (session: AuctionSessionView) => void;
};

function statusLabel(status: string, count: number, min: number) {
  switch (status) {
    case "gathering":
      return `Gathering sellers (${count}/${min})`;
    case "scheduled":
      return "Scheduled — starting soon";
    case "live":
      return "Live trading";
    case "ended":
      return "Auction completed";
    case "no_winner":
      return "No winner";
    default:
      return status;
  }
}

export default function AuctionRoom({ sessionId, mode, compact, onSessionLoaded }: Props) {
  const { session, setSession, lastDrop, roundEnding } = useAuctionSession(sessionId);
  const [acting, setActing] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  const load = useCallback(async () => {
    const data = await apiFetchWithRefresh<AuctionSessionView>(
      `/api/v1/auctions/${sessionId}`,
      { service: "auction" },
    );
    setSession(data);
    onSessionLoaded?.(data);
  }, [sessionId, setSession, onSessionLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (lastDrop) setFlashKey((k) => k + 1);
  }, [lastDrop]);

  const tickSession = session;
  const secondsRemaining = useAuctionTick(tickSession);
  const urgent =
    secondsRemaining != null &&
    tickSession?.rules.urgentThresholdSeconds != null &&
    secondsRemaining <= tickSession.rules.urgentThresholdSeconds;

  const myParticipant = tickSession?.participants.find((p) => p.isMe);
  const canAct =
    mode === "seller" &&
    tickSession?.status === "live" &&
    myParticipant &&
    ["active", "registered"].includes(myParticipant.status);

  const act = async (action: "lower" | "hold" | "withdraw") => {
    setActing(true);
    try {
      const data = await apiFetchWithRefresh<AuctionSessionView>(
        `/api/v1/auctions/${sessionId}/${action}`,
        { method: "POST", service: "auction" },
      );
      setSession(data);
    } finally {
      setActing(false);
    }
  };

  if (!tickSession) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currency = tickSession.request.currency;
  const leader = tickSession.leader;

  return (
    <div
      className={`auction-room relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      {lastDrop && (
        <div key={flashKey} className="auction-price-flash pointer-events-none absolute inset-0 z-10" aria-hidden />
      )}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Reverse auction
          </p>
          <h2 className={`font-semibold text-[var(--foreground)] ${compact ? "text-base" : "text-lg"}`}>
            {tickSession.request.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {statusLabel(tickSession.status, tickSession.participantCount, tickSession.minParticipants)}
          </p>
        </div>
        <AuctionRulesHelp />
      </div>

      {tickSession.status === "live" && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
            urgent || roundEnding
              ? "auction-timer-urgent bg-red-50 dark:bg-red-950/30"
              : "bg-[var(--surface-muted)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined ${urgent || roundEnding ? "text-red-600" : "text-primary"}`}
            >
              {roundEnding ? "hourglass_bottom" : urgent ? "warning" : "timer"}
            </span>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {roundEnding
                ? "Round closing — next round starting…"
                : urgent
                  ? "Time running out!"
                  : `Round ${tickSession.currentRound}`}
              {tickSession.roundPausedUntil && !roundEnding ? " · Pausing…" : ""}
            </span>
          </div>
          {secondsRemaining != null && !tickSession.roundPausedUntil && (
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                urgent || roundEnding ? "text-red-600" : "text-[var(--foreground)]"
              }`}
            >
              {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:
              {String(secondsRemaining % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      )}

      {lastDrop && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-[var(--foreground)] auction-row-drop">
          <span className="material-symbols-outlined text-primary">trending_down</span>
          Price lowered —{" "}
          {formatMoney(lastDrop.priceAfter, currency)}
        </div>
      )}

      {tickSession.status === "scheduled" && tickSession.scheduledAt && (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-[var(--foreground)]">
          Trading starts at{" "}
          <strong>{new Date(tickSession.scheduledAt).toLocaleTimeString()}</strong>
        </p>
      )}

      {leader?.price != null && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Current best price</p>
          <p className="text-2xl font-bold text-primary">{formatMoney(leader.price, currency)}</p>
        </div>
      )}

      <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">Current</th>
              <th className="px-3 py-2 hidden sm:table-cell">Floor</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickSession.participants.map((p) => {
              const isLeader = leader?.sellerId === p.sellerId;
              const dropped =
                lastDrop?.sellerId === p.sellerId ? "auction-row-drop" : "";
              return (
                <tr
                  key={p.id}
                  className={`border-t border-[var(--border)] ${isLeader ? "bg-primary/5" : ""} ${dropped}`}
                >
                  <td className="px-3 py-2.5 font-medium text-[var(--foreground)]">
                    {p.sellerName}
                    {isLeader && (
                      <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        Lead
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">
                    {formatMoney(p.currentPrice, currency)}
                  </td>
                  <td className="hidden px-3 py-2.5 tabular-nums text-[var(--text-muted)] sm:table-cell">
                    {formatMoney(p.floorPrice, currency)}
                  </td>
                  <td className="px-3 py-2.5 capitalize text-[var(--text-muted)]">{p.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canAct && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={acting || (myParticipant?.currentPrice ?? 0) <= (myParticipant?.floorPrice ?? 0)}
            onClick={() => void act("lower")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-[#0d1b12] shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">trending_down</span>
            Lower price
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void act("hold")}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
          >
            Hold
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void act("withdraw")}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10"
          >
            Withdraw
          </button>
        </div>
      )}

      {tickSession.status === "ended" && tickSession.winner?.price != null && (
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Winner secured at{" "}
          <strong>{formatMoney(tickSession.winner.price, currency)}</strong>. An offer was created
          automatically.
        </p>
      )}

      {!compact && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          <Link href={`/auctions/${tickSession.requestId}`} className="text-primary hover:underline">
            Open full auction view
          </Link>
        </p>
      )}
    </div>
  );
}
