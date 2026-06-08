export type AuctionRules = {
  enabled: boolean;
  minParticipants: number;
  scheduleDelayMinutes: number;
  roundDurationSeconds: number;
  roundPauseSeconds: number;
  priceStepPercent: number;
  minStepAmount: number;
  maxInactiveRoundsBeforeWithdraw: number;
  noBidRoundsToEnd: number;
  maxRounds: number;
  urgentThresholdSeconds: number;
};

export type AuctionTooltip = { id: string; title: string; body: string };

export type AuctionParticipantView = {
  id: string;
  sellerId: string;
  sellerName: string;
  startPrice: number;
  floorPrice: number;
  currentPrice: number;
  currency: string;
  status: string;
  inactiveRounds: number;
  actedThisRound: boolean;
  isMe: boolean;
};

export type AuctionSessionView = {
  id: string;
  requestId: string;
  status: string;
  participantCount: number;
  minParticipants: number;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  currentRound: number;
  roundEndsAt: string | null;
  roundPausedUntil: string | null;
  secondsRemaining: number | null;
  isUrgent: boolean;
  leader: { sellerId: string; price: number | null } | null;
  winner: { sellerId: string; price: number | null } | null;
  request: {
    id: string;
    title: string;
    buyerId: string;
    currency: string;
    quantity: number;
    budgetMax: unknown;
    status: string;
    deadlineAt: string | null;
  };
  participants: AuctionParticipantView[];
  recentEvents: {
    id: string;
    sellerId: string;
    roundNumber: number;
    priceBefore: number;
    priceAfter: number;
    eventType: string;
    createdAt: string;
  }[];
  rules: AuctionRules;
};

export type AuctionStreamPayload = {
  type: string;
  payload: Record<string, unknown>;
  at?: string;
};
