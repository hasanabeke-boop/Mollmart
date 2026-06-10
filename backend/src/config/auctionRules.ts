/** Platform-wide reverse auction rules (not configurable per request). */
export const auctionRules = {
  enabled: true,
  minParticipants: 3,
  /** After the 3rd seller joins, auction starts after this delay. */
  scheduleDelaySeconds: 30,
  /** Each bidding round length. */
  roundDurationSeconds: 45,
  /** Pause between rounds (buyers/sellers see results). */
  roundPauseSeconds: 5,
  /** Price drop per lower action: max(minStepAmount, current × percent). */
  priceStepPercent: 2.5,
  minStepAmount: 1,
  /** Auto-withdraw after this many rounds with no action. */
  maxInactiveRoundsBeforeWithdraw: 3,
  /** End auction after this many consecutive rounds with no price drops. */
  noBidRoundsToEnd: 2,
  maxRounds: 30,
  /** Urgent timer styling threshold (seconds). */
  urgentThresholdSeconds: 12,
} as const;

export type AuctionRulesPublic = typeof auctionRules;

export const auctionRulesTooltips = [
  {
    id: 'mode',
    title: 'Reverse auction',
    body: 'Sellers compete by lowering their price. The lowest active bid when trading ends wins the request.',
  },
  {
    id: 'min',
    title: 'Minimum 3 sellers',
    body: 'Trading starts only after at least 3 sellers register. Until then the request stays open for registration.',
  },
  {
    id: 'schedule',
    title: 'Fixed start delay',
    body: `When the 3rd seller joins, live trading is scheduled ${auctionRules.scheduleDelaySeconds} seconds later so everyone can prepare.`,
  },
  {
    id: 'rounds',
    title: 'Round timer',
    body: `Each round lasts ${auctionRules.roundDurationSeconds} seconds. Lower your price or hold — if you do nothing, your price is held automatically.`,
  },
  {
    id: 'step',
    title: 'Price step',
    body: `Each "Lower price" action drops your bid by ${auctionRules.priceStepPercent}% (minimum ${auctionRules.minStepAmount} in request currency), never below your floor.`,
  },
  {
    id: 'floor',
    title: 'Floor price',
    body: 'Your floor is the lowest price you are willing to offer. You cannot go below it during trading.',
  },
  {
    id: 'inactive',
    title: 'Inactivity',
    body: `If you take no action for ${auctionRules.maxInactiveRoundsBeforeWithdraw} rounds in a row, you are withdrawn from this auction only.`,
  },
  {
    id: 'end',
    title: 'How trading ends',
    body: `Trading ends when no seller lowers for ${auctionRules.noBidRoundsToEnd} consecutive rounds, or after ${auctionRules.maxRounds} rounds. The lowest price wins.`,
  },
  {
    id: 'multiple',
    title: 'Multiple live auctions',
    body: 'You can join several auctions at once. Use tabs on Active auctions — each runs independently.',
  },
] as const;
