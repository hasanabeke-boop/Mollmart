"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetchWithRefresh } from "@/lib/api";
import { buildAuctionTooltips } from "@/lib/auctionTooltips";
import type { AuctionRules, AuctionTooltip } from "@/lib/auctionTypes";

let cachedRules: AuctionRules | null = null;

export function useAuctionRules() {
  const [rules, setRules] = useState<AuctionRules | null>(cachedRules);
  const [loading, setLoading] = useState(!cachedRules);

  useEffect(() => {
    if (cachedRules) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetchWithRefresh<{ rules: AuctionRules; tooltips: AuctionTooltip[] }>(
          "/api/v1/auctions/rules",
          { service: "auction" },
        );
        if (!cancelled) {
          cachedRules = res.rules;
          setRules(res.rules);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rules, loading };
}

type AuctionRulesHelpProps = {
  className?: string;
};

export default function AuctionRulesHelp({ className = "" }: AuctionRulesHelpProps) {
  const { t } = useLanguage();
  const { rules, loading } = useAuctionRules();
  const tooltips = rules ? buildAuctionTooltips(t, rules) : [];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-primary hover:text-primary"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="material-symbols-outlined text-base">help</span>
        {t("Auction rules")}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[200] bg-black/45 md:hidden"
            aria-label={t("Close")}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auction-rules-title"
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(80vh,28rem)] w-[calc(100vw-2rem)] max-w-[22rem] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:max-h-64 md:w-[min(calc(100vw-2rem),22rem)] md:translate-x-0 md:translate-y-0"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p id="auction-rules-title" className="text-sm font-semibold text-[var(--foreground)]">
                {t("How reverse auctions work")}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] md:hidden"
                onClick={() => setOpen(false)}
                aria-label={t("Close")}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-[var(--text-muted)]">{t("Loading…")}</p>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {tooltips.map((item) => (
                  <li key={item.id} className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-2">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
