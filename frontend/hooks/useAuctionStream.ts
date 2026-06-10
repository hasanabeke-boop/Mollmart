"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, apiFetchWithRefresh, getAccessToken } from "@/lib/api";
import type { AuctionSessionView, AuctionStreamPayload } from "@/lib/auctionTypes";

function mergeSessionState(
  prev: AuctionSessionView | null,
  next: AuctionSessionView,
): AuctionSessionView {
  if (!prev) return next;
  const prevMe = prev.participants.find((p) => p.isMe);
  return {
    ...next,
    participants: next.participants.map((p) => {
      if (p.isMe && p.floorPrice == null && prevMe?.floorPrice != null) {
        return { ...p, floorPrice: prevMe.floorPrice };
      }
      return p;
    }),
  };
}

export function useAuctionStream(
  sessionId: string | null,
  onEvent?: (event: AuctionStreamPayload) => void,
) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!sessionId) return;

    const token = getAccessToken();
    if (!token) return;

    const url = `${API_BASE}/api/v1/auctions/${encodeURIComponent(sessionId)}/stream?access_token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    const handle = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as AuctionStreamPayload;
        onEventRef.current?.(parsed);
      } catch {
        // ignore malformed
      }
    };

    source.addEventListener("state", handle);
    source.addEventListener("price_lowered", handle);
    source.addEventListener("round_started", handle);
    source.addEventListener("round_ending", handle);
    source.addEventListener("ended", handle);
    source.addEventListener("participant_joined", handle);
    source.addEventListener("scheduled", handle);
    source.addEventListener("hold", handle);
    source.addEventListener("withdraw", handle);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      setConnected(false);
    };
  }, [sessionId]);

  return { connected };
}

export function applyStreamState(
  prev: AuctionSessionView | null,
  event: AuctionStreamPayload,
): AuctionSessionView | null {
  if (event.type === "state" && event.payload) {
    return mergeSessionState(prev, event.payload as unknown as AuctionSessionView);
  }
  return prev;
}

export function useAuctionTick(
  session: AuctionSessionView | null,
  onRoundElapsed?: () => void,
) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    session?.secondsRemaining ?? null,
  );
  const elapsedRef = useRef(false);

  useEffect(() => {
    elapsedRef.current = false;
  }, [session?.roundEndsAt, session?.currentRound]);

  useEffect(() => {
    if (
      !session ||
      session.status !== "live" ||
      !session.roundEndsAt ||
      session.roundPausedUntil
    ) {
      setSecondsRemaining(null);
      return;
    }

    const tick = () => {
      const end = new Date(session.roundEndsAt!).getTime();
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0 && !elapsedRef.current) {
        elapsedRef.current = true;
        onRoundElapsed?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [session, onRoundElapsed]);

  return secondsRemaining;
}

export function useAuctionSession(sessionId: string | null) {
  const [session, setSession] = useState<AuctionSessionView | null>(null);
  const [lastDrop, setLastDrop] = useState<{ sellerId: string; priceAfter: number } | null>(null);
  const [roundEnding, setRoundEnding] = useState(false);

  const reload = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await apiFetchWithRefresh<AuctionSessionView>(
        `/api/v1/auctions/${sessionId}`,
        { service: "auction" },
      );
      setSession((prev) => mergeSessionState(prev, data));
    } catch {
      // keep last snapshot
    }
  }, [sessionId]);

  const onEvent = useCallback(
    (event: AuctionStreamPayload) => {
      if (event.type === "state" && event.payload) {
        setSession((prev) =>
          mergeSessionState(prev, event.payload as unknown as AuctionSessionView),
        );
      }
      if (event.type === "price_lowered") {
        const sellerId = String(event.payload.sellerId ?? "");
        const priceAfter = Number(event.payload.priceAfter ?? 0);
        setLastDrop({ sellerId, priceAfter });
        window.setTimeout(() => setLastDrop(null), 1200);
      }
      if (event.type === "round_ending") {
        setRoundEnding(true);
        setSession((prev) =>
          prev
            ? {
                ...prev,
                roundEndsAt: null,
                roundPausedUntil: String(
                  event.payload.pauseUntil ?? prev.roundPausedUntil ?? "",
                ),
                secondsRemaining: null,
              }
            : prev,
        );
        window.setTimeout(() => setRoundEnding(false), 2500);
        void reload();
      }
      if (event.type === "round_started") {
        setRoundEnding(false);
        void reload();
      }
      if (event.type === "ended") {
        void reload();
      }
    },
    [reload],
  );

  useAuctionStream(sessionId, onEvent);

  useEffect(() => {
    if (!sessionId || !session) return;
    if (!["live", "scheduled", "gathering"].includes(session.status)) return;
    const id = window.setInterval(() => void reload(), 4000);
    return () => window.clearInterval(id);
  }, [sessionId, session?.status, reload]);

  return { session, setSession, lastDrop, roundEnding, reload };
}
