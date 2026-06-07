"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, getAccessToken } from "@/lib/api";
import type { AuctionSessionView, AuctionStreamPayload } from "@/lib/auctionTypes";

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
        if (parsed.type === "state") {
          // handled by parent via callback
        }
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
    return event.payload as unknown as AuctionSessionView;
  }
  return prev;
}

export function useAuctionTick(session: AuctionSessionView | null) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    session?.secondsRemaining ?? null,
  );

  useEffect(() => {
    if (!session || session.status !== "live" || !session.roundEndsAt || session.roundPausedUntil) {
      setSecondsRemaining(null);
      return;
    }

    const tick = () => {
      const end = new Date(session.roundEndsAt!).getTime();
      setSecondsRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [session]);

  return secondsRemaining;
}

export function useAuctionSession(sessionId: string | null) {
  const [session, setSession] = useState<AuctionSessionView | null>(null);
  const [lastDrop, setLastDrop] = useState<{ sellerId: string; priceAfter: number } | null>(null);
  const [roundEnding, setRoundEnding] = useState(false);

  const onEvent = useCallback((event: AuctionStreamPayload) => {
    if (event.type === "state" && event.payload) {
      setSession(event.payload as unknown as AuctionSessionView);
    }
    if (event.type === "price_lowered") {
      const sellerId = String(event.payload.sellerId ?? "");
      const priceAfter = Number(event.payload.priceAfter ?? 0);
      setLastDrop({ sellerId, priceAfter });
      window.setTimeout(() => setLastDrop(null), 1200);
    }
    if (event.type === "round_ending") {
      setRoundEnding(true);
      window.setTimeout(() => setRoundEnding(false), 2500);
    }
    if (event.type === "round_started") {
      setRoundEnding(false);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentRound: Number(event.payload.round ?? prev.currentRound),
              roundEndsAt: String(event.payload.roundEndsAt ?? prev.roundEndsAt ?? ""),
              roundPausedUntil: null,
            }
          : prev,
      );
    }
  }, []);

  useAuctionStream(sessionId, onEvent);

  return { session, setSession, lastDrop, roundEnding };
}
