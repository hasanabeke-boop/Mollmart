"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuctionRoom from "@/components/auction/AuctionRoom";
import AuctionRulesHelp from "@/components/auction/AuctionRulesHelp";
import { apiFetchWithRefresh } from "@/lib/api";
import type { AuctionSessionView } from "@/lib/auctionTypes";

type Props = { params: Promise<{ requestId: string }> };

export default function AuctionWatchPage({ params }: Props) {
  const { requestId } = use(params);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [session, setSession] = useState<AuctionSessionView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetchWithRefresh<AuctionSessionView>(
          `/api/v1/auctions/request/${requestId}`,
          { service: "auction" },
        );
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) setError(t("Auction not found for this request yet."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, t]);

  const isBuyer = user?.id === session?.request.buyerId;
  const isParticipant = session?.participants.some((p) => p.isMe);
  const mode = isParticipant ? "seller" : isBuyer ? "buyer" : "spectator";

  return (
    <div className="app-page app-page-wide mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={isBuyer ? "/my-requests" : "/seller/auctions"}
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-primary"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t("Back")}
        </Link>
        <AuctionRulesHelp />
      </div>

      {error && !session ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--foreground)]">{error}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t(
              "Auctions open automatically when a request is published. Sellers must join before trading starts.",
            )}
          </p>
        </div>
      ) : session ? (
        <AuctionRoom sessionId={session.id} mode={mode} onSessionLoaded={setSession} />
      ) : (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
