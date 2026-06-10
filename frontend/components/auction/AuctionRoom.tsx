"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ShippingFields from "@/components/shipping/ShippingFields";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetchWithRefresh } from "@/lib/api";
import { placeAuctionWinnerOrder } from "@/lib/auctionApi";
import { formatMoney } from "@/lib/currency";
import { EMPTY_SHIPPING, validateShipping } from "@/lib/shipping";
import type { AuctionSessionView } from "@/lib/auctionTypes";
import { computeAuctionStepTarget } from "@/lib/auctionPricing";
import { useAuctionSession, useAuctionTick } from "@/hooks/useAuctionStream";

type Props = {
  sessionId: string;
  mode: "seller" | "buyer" | "spectator";
  compact?: boolean;
  onSessionLoaded?: (session: AuctionSessionView) => void;
};

export default function AuctionRoom({ sessionId, mode, compact, onSessionLoaded }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const { session, setSession, lastDrop, roundEnding, reload } = useAuctionSession(sessionId);
  const [acting, setActing] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState(EMPTY_SHIPPING);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [lowerTarget, setLowerTarget] = useState("");
  const [lowerError, setLowerError] = useState("");

  const statusLabel = useCallback(
    (status: string, count: number, min: number) => {
      switch (status) {
        case "gathering":
          return t("Gathering sellers ({count}/{min})", { count, min });
        case "scheduled":
          return t("Scheduled — starting soon");
        case "live":
          return t("Live trading");
        case "ended":
          return t("Auction completed");
        case "no_winner":
          return t("No winner");
        default:
          return status;
      }
    },
    [t],
  );

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
  const myParticipant = tickSession?.participants.find((p) => p.isMe);
  const canAct =
    mode === "seller" &&
    tickSession?.status === "live" &&
    myParticipant != null &&
    ["active", "registered"].includes(myParticipant.status);
  const secondsRemaining = useAuctionTick(tickSession, reload);

  useEffect(() => {
    if (tickSession?.status === "ended" || tickSession?.status === "no_winner") {
      void reload();
    }
  }, [tickSession?.status, reload]);

  useEffect(() => {
    if (!canAct || myParticipant?.currentPrice == null) return;
    setLowerTarget((prev) => (prev === "" ? String(myParticipant.currentPrice) : prev));
  }, [canAct, myParticipant?.currentPrice, myParticipant?.id]);

  const urgent =
    secondsRemaining != null &&
    tickSession?.rules.urgentThresholdSeconds != null &&
    secondsRemaining <= tickSession.rules.urgentThresholdSeconds;

  const act = async (action: "lower" | "hold" | "withdraw", targetPrice?: number) => {
    setActing(true);
    setLowerError("");
    try {
      const data = await apiFetchWithRefresh<AuctionSessionView>(
        `/api/v1/auctions/${sessionId}/${action}`,
        {
          method: "POST",
          service: "auction",
          ...(action === "lower" && targetPrice != null
            ? { body: JSON.stringify({ targetPrice }) }
            : {}),
        },
      );
      setSession(data);
      if (action === "lower") {
        const me = data.participants.find((p) => p.isMe);
        if (me) setLowerTarget(String(me.currentPrice));
      }
    } catch (err) {
      if (action === "lower") {
        setLowerError((err as Error).message || t("Could not lower price."));
      }
    } finally {
      setActing(false);
    }
  };

  const submitLower = () => {
    const target = Number(lowerTarget);
    const current = myParticipant?.currentPrice ?? 0;
    const floor = myParticipant?.floorPrice ?? 0;
    if (!Number.isFinite(target) || target <= 0) {
      setLowerError(t("Enter a valid target price."));
      return;
    }
    if (target >= current) {
      setLowerError(t("Target price must be lower than your current price."));
      return;
    }
    if (floor > 0 && target < floor) {
      setLowerError(t("Target price cannot be below your floor."));
      return;
    }
    void act("lower", target);
  };

  const atFloor =
    myParticipant?.floorPrice != null &&
    myParticipant.currentPrice <= myParticipant.floorPrice;

  const stepTarget =
    myParticipant?.floorPrice != null && tickSession?.rules
      ? computeAuctionStepTarget(
          myParticipant.currentPrice,
          myParticipant.floorPrice,
          tickSession.rules,
        )
      : null;
  const stepPercent = tickSession?.rules.priceStepPercent ?? 2.5;

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
            {t("Reverse auction")}
          </p>
          <h2 className={`font-semibold text-[var(--foreground)] ${compact ? "text-base" : "text-lg"}`}>
            {tickSession.request.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {statusLabel(tickSession.status, tickSession.participantCount, tickSession.minParticipants)}
          </p>
        </div>
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
                ? t("Round closing — next round starting…")
                : urgent
                  ? t("Time running out!")
                  : t("Round {round}", { round: tickSession.currentRound })}
              {tickSession.roundPausedUntil && !roundEnding ? t(" · Pausing…") : ""}
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
          {t("Price lowered —")} {formatMoney(lastDrop.priceAfter, currency)}
        </div>
      )}

      {tickSession.status === "scheduled" && tickSession.scheduledAt && (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-[var(--foreground)]">
          {t("Trading starts at")}{" "}
          <strong>{new Date(tickSession.scheduledAt).toLocaleTimeString()}</strong>
        </p>
      )}

      {leader?.price != null && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("Current best price")}</p>
          <p className="text-2xl font-bold text-primary">{formatMoney(leader.price, currency)}</p>
        </div>
      )}

      <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2">{t("Seller")}</th>
              <th className="px-3 py-2">{t("Current")}</th>
              <th className="px-3 py-2">{t("Status")}</th>
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
                        {t("Lead")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">
                    {formatMoney(p.currentPrice, currency)}
                  </td>
                  <td className="px-3 py-2.5 capitalize text-[var(--text-muted)]">{t(p.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canAct && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                {t("Auto step ({percent}%)", { percent: stepPercent })}
              </p>
              <button
                type="button"
                disabled={acting || atFloor || stepTarget == null}
                onClick={() => void act("lower")}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-primary bg-primary/10 px-4 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-primary/15 disabled:opacity-40 sm:w-auto"
              >
                <span className="material-symbols-outlined text-lg">trending_down</span>
                {t("Lower by {percent}%", { percent: stepPercent })}
                {stepTarget != null ? (
                  <span className="font-normal text-[var(--text-muted)]">
                    → {formatMoney(stepTarget, currency)}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="relative border-t border-[var(--border)] pt-4">
              <span className="absolute -top-2.5 left-0 bg-[var(--surface-muted)] pr-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t("Or set your own price")}
              </span>
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {t("Lower to price ({currency})", { currency })}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={lowerTarget}
                  onChange={(e) => {
                    setLowerTarget(e.target.value);
                    setLowerError("");
                  }}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm tabular-nums text-[var(--foreground)]"
                />
              </label>
              <button
                type="button"
                disabled={acting || atFloor}
                onClick={submitLower}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-[#0d1b12] shadow-sm transition hover:opacity-90 disabled:opacity-40 sm:w-auto"
              >
                {t("Lower to price")}
              </button>
            </div>

            {myParticipant?.floorPrice != null ? (
              <p className="text-xs text-[var(--text-muted)]">
                {t("Your floor: {amount}", {
                  amount: formatMoney(myParticipant.floorPrice, currency),
                })}{" "}
                · {t("Current")}: {formatMoney(myParticipant.currentPrice, currency)}
              </p>
            ) : null}
            {lowerError ? <p className="text-xs text-red-600">{lowerError}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() => void act("hold")}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            >
              {t("Hold")}
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void act("withdraw")}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10"
            >
              {t("Withdraw")}
            </button>
          </div>
        </div>
      )}

      {tickSession.status === "ended" && tickSession.winner?.price != null && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {t("Auction winner")}
          </p>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {t("Winning bid")}{" "}
            <strong>{formatMoney(tickSession.winner.price, currency)}</strong>
            {tickSession.winnerLineTotal != null && tickSession.request.quantity > 1 ? (
              <>
                {" "}
                · {t("Total")}{" "}
                <strong>{formatMoney(tickSession.winnerLineTotal, currency)}</strong>
              </>
            ) : null}
          </p>
          {tickSession.orderId ? (
            <Link
              href={`/orders/${tickSession.orderId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-[#0d1b12] hover:opacity-90"
            >
              {t("View order")}
            </Link>
          ) : tickSession.canPayAsBuyer && mode === "buyer" ? (
            <button
              type="button"
              onClick={() => {
                setOrderError("");
                setOrderOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-[#0d1b12] hover:opacity-90"
            >
              {t("Accept offer & submit details")}
            </button>
          ) : mode === "buyer" ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t("Order placement is not available for your account.")}
            </p>
          ) : null}
        </div>
      )}

      {orderOpen && tickSession.canPayAsBuyer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--foreground)]">{t("Accept offer & submit details")}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("Enter delivery details to create the order. Payment is arranged directly with the seller.")}
            </p>
            {orderError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {orderError}
              </p>
            ) : null}
            <div className="mt-4">
              <ShippingFields
                value={shippingForm}
                onChange={(patch) => setShippingForm((s) => ({ ...s, ...patch }))}
                inputClassName="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                disabled={orderBusy}
                onClick={() => {
                  setOrderOpen(false);
                  setShippingForm(EMPTY_SHIPPING);
                  setOrderError("");
                }}
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                disabled={orderBusy || validateShipping(shippingForm) != null}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-[#0d1b12] hover:opacity-90 disabled:opacity-50"
                onClick={async () => {
                  const validationError = validateShipping(shippingForm);
                  if (validationError) {
                    setOrderError(validationError);
                    return;
                  }
                  setOrderBusy(true);
                  setOrderError("");
                  try {
                    const order = await placeAuctionWinnerOrder(tickSession.requestId, shippingForm);
                    setOrderOpen(false);
                    setShippingForm(EMPTY_SHIPPING);
                    router.push(`/orders/${order.id}`);
                  } catch (e) {
                    setOrderError((e as Error).message || t("Could not create order."));
                  } finally {
                    setOrderBusy(false);
                  }
                }}
              >
                {orderBusy ? t("Processing…") : t("Create order")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!compact && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          <Link href={`/auctions/${tickSession.requestId}`} className="text-primary hover:underline">
            {t("Open full auction view")}
          </Link>
        </p>
      )}
    </div>
  );
}
