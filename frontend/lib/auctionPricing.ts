import type { AuctionRules } from "@/lib/auctionTypes";

export function computeAuctionStepTarget(
  current: number,
  floor: number,
  rules: Pick<AuctionRules, "priceStepPercent" | "minStepAmount">,
): number | null {
  if (current <= floor) return null;
  const pct = current * (rules.priceStepPercent / 100);
  const step = Math.max(rules.minStepAmount, Math.round(pct * 100) / 100);
  const next = Math.round((current - step) * 100) / 100;
  if (next <= floor) return floor;
  return next;
}
