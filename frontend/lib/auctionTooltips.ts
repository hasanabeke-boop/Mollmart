import type { AuctionRules, AuctionTooltip } from "@/lib/auctionTypes";

type TranslateFn = (text: string, vars?: Record<string, string | number>) => string;

export function buildAuctionTooltips(t: TranslateFn, rules: AuctionRules): AuctionTooltip[] {
  const min = rules.minParticipants;
  return [
    {
      id: "mode",
      title: t("Reverse auction"),
      body: t(
        "Sellers compete by lowering their price. The lowest active bid when trading ends wins the request.",
      ),
    },
    {
      id: "min",
      title: t("Minimum {min} sellers", { min }),
      body: t(
        "Trading starts only after at least {min} sellers register. Until then the request stays open for registration.",
        { min },
      ),
    },
    {
      id: "schedule",
      title: t("Fixed start delay"),
      body: t(
        "When the {min}th seller joins, live trading starts in {seconds} seconds so everyone can prepare.",
        { min, seconds: rules.scheduleDelaySeconds },
      ),
    },
    {
      id: "rounds",
      title: t("Round timer"),
      body: t(
        "Each round lasts {seconds} seconds. Lower your price or hold — if you do nothing, your price is held automatically.",
        { seconds: rules.roundDurationSeconds },
      ),
    },
    {
      id: "step",
      title: t("Price step"),
      body: t(
        'Each "Lower price" action drops your bid by {percent}% (minimum {minStep} in request currency), never below your floor.',
        { percent: rules.priceStepPercent, minStep: rules.minStepAmount },
      ),
    },
    {
      id: "floor",
      title: t("Floor price"),
      body: t(
        "Your floor is the lowest price you are willing to offer. You cannot go below it during trading.",
      ),
    },
    {
      id: "inactive",
      title: t("Inactivity"),
      body: t(
        "If you take no action for {rounds} rounds in a row, you are withdrawn from this auction only.",
        { rounds: rules.maxInactiveRoundsBeforeWithdraw },
      ),
    },
    {
      id: "end",
      title: t("How trading ends"),
      body: t(
        "Trading ends when no seller lowers for {noBidRounds} consecutive rounds, or after {maxRounds} rounds. The lowest price wins.",
        { noBidRounds: rules.noBidRoundsToEnd, maxRounds: rules.maxRounds },
      ),
    },
    {
      id: "multiple",
      title: t("Multiple live auctions"),
      body: t(
        "You can join several auctions at once. Use tabs on Active auctions — each runs independently.",
      ),
    },
  ];
}
