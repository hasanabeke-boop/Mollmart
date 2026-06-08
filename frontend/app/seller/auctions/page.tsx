"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGate from "@/components/auth/RoleGate";
import AuctionRoom from "@/components/auction/AuctionRoom";
import AuctionRulesHelp, { useAuctionRules } from "@/components/auction/AuctionRulesHelp";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetchWithRefresh } from "@/lib/api";
import type { AuctionSessionView } from "@/lib/auctionTypes";

export default function SellerAuctionsPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<AuctionSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchWithRefresh<AuctionSessionView[]>("/api/v1/auctions/me", {
        service: "auction",
      });
      setSessions(data);
      setActiveId((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev;
        const live = data.find((s) => s.status === "live");
        return live?.id ?? data[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timerId = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timerId);
  }, [load]);

  const { rules } = useAuctionRules();
  const minSellers = rules?.minParticipants ?? 3;

  const sorted = useMemo(() => {
    const order = { live: 0, scheduled: 1, gathering: 2 } as Record<string, number>;
    return [...sessions].sort(
      (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9),
    );
  }, [sessions]);

  const active = sorted.find((s) => s.id === activeId) ?? null;
  const liveCount = sorted.filter((s) => s.status === "live").length;

  return (
    <RoleGate
      allowedRoles={["seller", "admin"]}
      title={t("Seller workspace")}
      description={t(
        "Active auctions are available in seller mode. Switch to seller workspace or browse buyer requests to join.",
      )}
      ctaHref="/browse-buyer-requests"
      ctaLabel={t("Browse requests")}
      unauthenticatedDescription={t("Log in as a seller to view active auctions.")}
    >
      <div className="app-page app-page-wide mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("Active auctions")}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("Join reverse auctions on buyer requests. Use tabs when several run at the same time.")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AuctionRulesHelp />
            <Link
              href="/browse-buyer-requests"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-[#0d1b12] hover:opacity-90"
            >
              {t("Browse requests")}
            </Link>
          </div>
        </div>

        {liveCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-[var(--foreground)]">
            <span className="material-symbols-outlined text-primary">bolt</span>
            {liveCount === 1
              ? t("{count} live auction right now", { count: liveCount })
              : t("{count} live auctions right now", { count: liveCount })}
          </div>
        )}

        {loading && sessions.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-[var(--text-muted)]">
              gavel
            </span>
            <p className="font-medium text-[var(--foreground)]">{t("No active auctions")}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t(
                'Open buyer requests and tap "Join auction" when at least {min} sellers are needed to start trading.',
                { min: minSellers },
              )}
            </p>
          </div>
        ) : (
          <>
            <div
              className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-0"
              role="tablist"
            >
              {sorted.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveId(s.id)}
                    className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border border-b-0 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {s.status === "live" && (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      )}
                      <span className="max-w-[10rem] truncate">{s.request.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {active && <AuctionRoom key={active.id} sessionId={active.id} mode="seller" />}
          </>
        )}
      </div>
    </RoleGate>
  );
}
