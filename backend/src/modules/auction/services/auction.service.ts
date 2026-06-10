import { auctionRules } from '../../../config/auctionRules';
import prisma from '../../../config/prisma';
import { AuthUser } from '../../request/types/express';
import { badRequest, conflict, forbidden, notFound } from '../../request/utils/apiError';
import { computeOfferLineTotal, normalizeRequestQuantity } from '../../../shared/offerPricing';
import AuctionRepository, {
  AuctionSessionFull,
  ParticipateInput
} from '../repositories/auction.repository';
import { auctionEventHub } from './auction-event-hub';

function toNumber(value: unknown): number {
  return Number(value);
}

export function computePriceStep(currentPrice: number): number {
  const pct = currentPrice * (auctionRules.priceStepPercent / 100);
  return Math.max(auctionRules.minStepAmount, Math.round(pct * 100) / 100);
}

export function computeLowerPrice(current: number, floor: number): number | null {
  if (current <= floor) return null;
  const step = computePriceStep(current);
  const next = Math.round((current - step) * 100) / 100;
  if (next <= floor) return floor;
  return next;
}

export function resolveLowerTargetPrice(
  current: number,
  floor: number,
  targetPrice?: number
): number {
  if (targetPrice != null) {
    const next = Math.round(targetPrice * 100) / 100;
    if (!Number.isFinite(next) || next <= 0) {
      throw badRequest('Enter a valid target price');
    }
    if (next >= current) {
      throw badRequest('Target price must be lower than your current price');
    }
    if (next < floor) {
      throw badRequest('Target price cannot be below your floor');
    }
    return next;
  }

  const next = computeLowerPrice(current, floor);
  if (next == null) throw badRequest('Already at floor price');
  return next;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function maskSellerName(name: string, sellerId: string, viewerId?: string): string {
  if (viewerId === sellerId) return `${name} (you)`;
  return `Seller ${sellerId.slice(-4).toUpperCase()}`;
}

export class AuctionService {
  constructor(private readonly repo: AuctionRepository) {}

  getRules() {
    return auctionRules;
  }

  async ensureSessionForRequest(requestId: string): Promise<void> {
    if (!auctionRules.enabled) return;
    const existing = await this.repo.findByRequestId(requestId);
    if (existing != null) return;
    await this.repo.createForRequest(requestId);
  }

  serializeSession(session: AuctionSessionFull, viewer?: AuthUser) {
    const now = Date.now();
    const roundEndsAt = session.roundEndsAt?.toISOString() ?? null;
    const secondsRemaining =
      session.status === 'live' && session.roundEndsAt != null && session.roundPausedUntil == null
        ? Math.max(0, Math.ceil((session.roundEndsAt.getTime() - now) / 1000))
        : null;

    return {
      id: session.id,
      requestId: session.requestId,
      status: session.status,
      participantCount: session.participantCount,
      minParticipants: auctionRules.minParticipants,
      scheduledAt: session.scheduledAt?.toISOString() ?? null,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      currentRound: session.currentRound,
      roundEndsAt,
      roundPausedUntil: session.roundPausedUntil?.toISOString() ?? null,
      secondsRemaining,
      isUrgent: secondsRemaining != null && secondsRemaining <= auctionRules.urgentThresholdSeconds,
      leader: session.leaderSellerId
        ? {
            sellerId: session.leaderSellerId,
            price: session.leaderPrice != null ? toNumber(session.leaderPrice) : null
          }
        : null,
      winner:
        session.winnerSellerId != null
          ? {
              sellerId: session.winnerSellerId,
              price: session.winningPrice != null ? toNumber(session.winningPrice) : null
            }
          : null,
      request: session.request,
      participants: session.participants.map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        sellerName: maskSellerName(p.seller.name, p.sellerId, viewer?.id),
        startPrice: toNumber(p.startPrice),
        floorPrice:
          viewer?.id === p.sellerId ? toNumber(p.floorPrice) : null,
        currentPrice: toNumber(p.currentPrice),
        currency: p.currency,
        status: p.status,
        inactiveRounds: p.inactiveRounds,
        actedThisRound: p.actedThisRound,
        isMe: viewer?.id === p.sellerId
      })),
      recentEvents: session.bidEvents.map((e) => ({
        id: e.id,
        sellerId: e.sellerId,
        roundNumber: e.roundNumber,
        priceBefore: toNumber(e.priceBefore),
        priceAfter: toNumber(e.priceAfter),
        eventType: e.eventType,
        createdAt: e.createdAt.toISOString()
      })),
      rules: auctionRules
    };
  }

  private async attachPaymentMeta(
    view: ReturnType<AuctionService['serializeSession']>,
    session: AuctionSessionFull,
    viewer?: AuthUser
  ) {
    if (session.status !== 'ended' || session.winnerSellerId == null) {
      return {
        ...view,
        orderId: null as string | null,
        winnerLineTotal: null as number | null,
        canPayAsBuyer: false
      };
    }

    const order = await prisma.requestDealOrder.findFirst({
      where: { requestId: session.requestId },
      select: { id: true }
    });
    const qty = normalizeRequestQuantity(session.request.quantity);
    const unitPrice = session.winningPrice != null ? toNumber(session.winningPrice) : null;
    const winnerLineTotal = unitPrice != null ? computeOfferLineTotal(unitPrice, qty) : null;
    const isBuyer = viewer?.id === session.request.buyerId;
    const canPayAsBuyer =
      order == null &&
      winnerLineTotal != null &&
      isBuyer &&
      viewer?.canBuy !== false;

    return {
      ...view,
      orderId: order?.id ?? null,
      winnerLineTotal,
      canPayAsBuyer
    };
  }

  private broadcastState(session: AuctionSessionFull): void {
    auctionEventHub.publish(session.id, {
      type: 'state',
      payload: this.serializeSession(session)
    });
  }

  async getByRequestId(requestId: string, user?: AuthUser) {
    const session = await this.repo.findByRequestId(requestId);
    if (session == null) throw notFound('Auction not found for this request');
    this.assertCanView(session, user);
    const view = this.serializeSession(session, user);
    return this.attachPaymentMeta(view, session, user);
  }

  async getById(sessionId: string, user?: AuthUser) {
    const session = await this.repo.findById(sessionId);
    if (session == null) throw notFound('Auction not found');
    this.assertCanView(session, user);
    const view = this.serializeSession(session, user);
    return this.attachPaymentMeta(view, session, user);
  }

  async listMine(user: AuthUser) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers can list auction participation');
    }
    const sessions = await this.repo.listSellerSessions(user.id, [
      'gathering',
      'scheduled',
      'live'
    ]);
    return sessions.map((s) => this.serializeSession(s, user));
  }

  async participate(user: AuthUser, requestId: string, input: ParticipateInput) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers can join auctions');
    }

    if (input.startPrice <= 0 || input.floorPrice <= 0) {
      throw badRequest('Prices must be greater than zero');
    }
    if (input.floorPrice > input.startPrice) {
      throw badRequest('Floor price cannot exceed starting price');
    }

    let session = await this.repo.findByRequestId(requestId);
    if (session == null) {
      throw notFound('Auction is not enabled for this request');
    }

    if (!['gathering', 'scheduled'].includes(session.status)) {
      throw conflict('Registration is closed for this auction');
    }

    if (session.request.buyerId === user.id) {
      throw badRequest('Request owner cannot participate as seller');
    }

    const budgetMax = session.request.budgetMax != null ? toNumber(session.request.budgetMax) : null;
    if (budgetMax != null && input.startPrice > budgetMax) {
      throw badRequest('Starting price cannot exceed buyer budget maximum');
    }

    const existing = await this.repo.findParticipant(session.id, user.id);
    if (existing != null) throw conflict('You are already registered for this auction');

    const updated = await this.repo.addParticipant(session.id, user.id, input, session.request.currency);

    auctionEventHub.publish(session.id, {
      type: 'participant_joined',
      payload: { sellerId: user.id, participantCount: updated.participantCount }
    });

    if (
      updated.status === 'gathering' &&
      updated.participantCount >= auctionRules.minParticipants
    ) {
      const scheduled = await this.scheduleSession(updated.id);
      return this.serializeSession(scheduled, user);
    }

    this.broadcastState(updated);
    return this.serializeSession(updated, user);
  }

  private async scheduleSession(sessionId: string): Promise<AuctionSessionFull> {
    const scheduledAt = addSeconds(new Date(), auctionRules.scheduleDelaySeconds);
    const session = await this.repo.updateSession(sessionId, {
      status: 'scheduled',
      scheduledAt
    });
    auctionEventHub.publish(sessionId, {
      type: 'scheduled',
      payload: { scheduledAt: scheduledAt.toISOString() }
    });
    this.broadcastState(session);
    return session;
  }

  async lowerPrice(user: AuthUser, sessionId: string, targetPrice?: number) {
    const participant = await this.getActiveParticipant(user, sessionId);
    const session = await this.repo.findById(sessionId);
    if (session == null || session.status !== 'live') throw conflict('Auction is not live');

    const current = toNumber(participant.currentPrice);
    const floor = toNumber(participant.floorPrice);
    const next = resolveLowerTargetPrice(current, floor, targetPrice);

    await this.repo.recordBidEvent({
      sessionId,
      sellerId: user.id,
      roundNumber: session.currentRound,
      priceBefore: current,
      priceAfter: next,
      eventType: 'lower'
    });

    await this.repo.updateParticipant(participant.id, {
      currentPrice: next,
      actedThisRound: true,
      inactiveRounds: 0
    });

    const leader = await this.repo.getLeader(sessionId);
    const updated = await this.repo.updateSession(sessionId, {
      consecutiveNoBidRounds: 0,
      ...(leader != null
        ? { leaderSellerId: leader.sellerId, leaderPrice: leader.currentPrice }
        : {})
    });

    auctionEventHub.publish(sessionId, {
      type: 'price_lowered',
      payload: {
        sellerId: user.id,
        priceBefore: current,
        priceAfter: next,
        round: session.currentRound
      }
    });
    this.broadcastState(updated);
    return this.serializeSession(updated, user);
  }

  async hold(user: AuthUser, sessionId: string) {
    const participant = await this.getActiveParticipant(user, sessionId);
    const session = await this.repo.findById(sessionId);
    if (session == null || session.status !== 'live') throw conflict('Auction is not live');

    await this.repo.recordBidEvent({
      sessionId,
      sellerId: user.id,
      roundNumber: session.currentRound,
      priceBefore: toNumber(participant.currentPrice),
      priceAfter: toNumber(participant.currentPrice),
      eventType: 'hold'
    });

    await this.repo.updateParticipant(participant.id, {
      actedThisRound: true,
      inactiveRounds: 0
    });

    auctionEventHub.publish(sessionId, {
      type: 'hold',
      payload: { sellerId: user.id, round: session.currentRound }
    });

    const fresh = await this.repo.findById(sessionId);
    if (fresh != null) this.broadcastState(fresh);
    return this.getById(sessionId, user);
  }

  async withdraw(user: AuthUser, sessionId: string) {
    const participant = await this.getActiveParticipant(user, sessionId);
    const session = await this.repo.findById(sessionId);
    if (session == null) throw notFound('Auction not found');
    if (!['gathering', 'scheduled', 'live'].includes(session.status)) {
      throw conflict('Cannot withdraw now');
    }

    await this.repo.updateParticipant(participant.id, {
      status: 'withdrawn',
      withdrawnAt: new Date()
    });

    if (session.status === 'gathering' || session.status === 'scheduled') {
      const updated = await this.repo.updateSession(sessionId, {
        participantCount: { decrement: 1 }
      });
      if (
        updated.status === 'scheduled' &&
        updated.participantCount < auctionRules.minParticipants
      ) {
        const regather = await this.repo.updateSession(sessionId, {
          status: 'gathering',
          scheduledAt: null
        });
        this.broadcastState(regather);
        return this.serializeSession(regather, user);
      }
    }

    auctionEventHub.publish(sessionId, {
      type: 'withdraw',
      payload: { sellerId: user.id }
    });

    const fresh = await this.repo.findById(sessionId);
    if (fresh != null) {
      if (fresh.status === 'live') {
        const active = await this.repo.countActiveParticipants(sessionId);
        if (active === 0) {
          await this.finishAuction(fresh, 'no_winner');
        } else if (active === 1) {
          await this.finishAuction(fresh, 'ended');
        } else {
          this.broadcastState(fresh);
        }
      } else {
        this.broadcastState(fresh);
      }
    }
    return this.getById(sessionId, user);
  }

  async processTicks(): Promise<void> {
    if (!auctionRules.enabled) return;
    const now = new Date();

    const dueStart = await this.repo.listDueScheduled(now);
    for (const session of dueStart) {
      await this.startLive(session.id);
    }

    const dueEnd = await this.repo.listDueRoundEnd(now);
    for (const session of dueEnd) {
      await this.endRound(session.id);
    }

    const dueResume = await this.repo.listDueRoundResume(now);
    for (const session of dueResume) {
      await this.startNextRound(session.id);
    }
  }

  private async startLive(sessionId: string): Promise<void> {
    await this.repo.markParticipantsActive(sessionId);
    const roundEndsAt = addSeconds(new Date(), auctionRules.roundDurationSeconds);
    const session = await this.repo.updateSession(sessionId, {
      status: 'live',
      startedAt: new Date(),
      currentRound: 1,
      roundEndsAt,
      roundPausedUntil: null,
      consecutiveNoBidRounds: 0
    });
    await this.repo.resetRoundFlags(sessionId);
    const leader = await this.repo.getLeader(sessionId);
    if (leader != null) {
      await this.repo.updateSession(sessionId, {
        leaderSellerId: leader.sellerId,
        leaderPrice: leader.currentPrice
      });
    }

    auctionEventHub.publish(sessionId, {
      type: 'round_started',
      payload: { round: 1, roundEndsAt: roundEndsAt.toISOString() }
    });
    const fresh = await this.repo.findById(sessionId);
    if (fresh != null) this.broadcastState(fresh);
  }

  private async endRound(sessionId: string): Promise<void> {
    const session = await this.repo.findById(sessionId);
    if (session == null || session.status !== 'live') return;

    for (const p of session.participants) {
      if (!['active', 'registered'].includes(p.status)) continue;
      if (p.actedThisRound) continue;

      const inactive = p.inactiveRounds + 1;
      if (inactive >= auctionRules.maxInactiveRoundsBeforeWithdraw) {
        await this.repo.updateParticipant(p.id, {
          status: 'withdrawn',
          withdrawnAt: new Date(),
          inactiveRounds: inactive,
          actedThisRound: true
        });
        await this.repo.recordBidEvent({
          sessionId,
          sellerId: p.sellerId,
          roundNumber: session.currentRound,
          priceBefore: toNumber(p.currentPrice),
          priceAfter: toNumber(p.currentPrice),
          eventType: 'auto_withdraw'
        });
      } else {
        await this.repo.updateParticipant(p.id, {
          inactiveRounds: inactive,
          actedThisRound: true
        });
        await this.repo.recordBidEvent({
          sessionId,
          sellerId: p.sellerId,
          roundNumber: session.currentRound,
          priceBefore: toNumber(p.currentPrice),
          priceAfter: toNumber(p.currentPrice),
          eventType: 'auto_hold'
        });
      }
    }

    const lowerCount = await this.repo.countLowerEventsInRound(sessionId, session.currentRound);
    const hadLower = lowerCount > 0;

    const consecutive = hadLower ? 0 : session.consecutiveNoBidRounds + 1;
    const activeCount = await this.repo.countActiveParticipants(sessionId);

    if (activeCount === 0) {
      const fresh = await this.repo.findById(sessionId);
      if (fresh != null) await this.finishAuction(fresh, 'no_winner');
      return;
    }

    if (activeCount === 1) {
      const fresh = await this.repo.findById(sessionId);
      if (fresh != null) await this.finishAuction(fresh, 'ended');
      return;
    }

    if (
      consecutive >= auctionRules.noBidRoundsToEnd ||
      session.currentRound >= auctionRules.maxRounds
    ) {
      const fresh = await this.repo.findById(sessionId);
      if (fresh != null) await this.finishAuction(fresh, 'ended');
      return;
    }

    const pauseUntil = addSeconds(new Date(), auctionRules.roundPauseSeconds);
    await this.repo.updateSession(sessionId, {
      consecutiveNoBidRounds: consecutive,
      roundEndsAt: null,
      roundPausedUntil: pauseUntil
    });

    auctionEventHub.publish(sessionId, {
      type: 'round_ending',
      payload: { round: session.currentRound, pauseUntil: pauseUntil.toISOString() }
    });

    const paused = await this.repo.findById(sessionId);
    if (paused != null) this.broadcastState(paused);
  }

  private async startNextRound(sessionId: string): Promise<void> {
    const session = await this.repo.findById(sessionId);
    if (session == null || session.status !== 'live') return;

    const nextRound = session.currentRound + 1;
    const roundEndsAt = addSeconds(new Date(), auctionRules.roundDurationSeconds);
    await this.repo.resetRoundFlags(sessionId);
    const leader = await this.repo.getLeader(sessionId);

    const updated = await this.repo.updateSession(sessionId, {
      currentRound: nextRound,
      roundEndsAt,
      roundPausedUntil: null,
      ...(leader != null
        ? { leaderSellerId: leader.sellerId, leaderPrice: leader.currentPrice }
        : {})
    });

    auctionEventHub.publish(sessionId, {
      type: 'round_started',
      payload: { round: nextRound, roundEndsAt: roundEndsAt.toISOString() }
    });
    this.broadcastState(updated);
  }

  private async finishAuction(
    session: AuctionSessionFull,
    outcome: 'ended' | 'no_winner'
  ): Promise<void> {
    const leader = await this.repo.getLeader(session.id);

    if (outcome === 'no_winner' || leader == null) {
      const ended = await this.repo.updateSession(session.id, {
        status: 'no_winner',
        endedAt: new Date(),
        roundEndsAt: null,
        roundPausedUntil: null
      });
      auctionEventHub.publish(session.id, { type: 'ended', payload: { outcome: 'no_winner' } });
      this.broadcastState(ended);
      return;
    }

    await this.repo.updateParticipant(leader.id, { status: 'winner' });

    const ended = await this.repo.updateSession(session.id, {
      status: 'ended',
      endedAt: new Date(),
      roundEndsAt: null,
      roundPausedUntil: null,
      winnerSellerId: leader.sellerId,
      winningPrice: leader.currentPrice,
      leaderSellerId: leader.sellerId,
      leaderPrice: leader.currentPrice
    });

    auctionEventHub.publish(session.id, {
      type: 'ended',
      payload: {
        outcome: 'ended',
        winnerSellerId: leader.sellerId,
        winningPrice: toNumber(leader.currentPrice)
      }
    });
    this.broadcastState(ended);
  }

  private async getActiveParticipant(user: AuthUser, sessionId: string) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers can act in auctions');
    }
    const participant = await this.repo.findParticipant(sessionId, user.id);
    if (participant == null) throw notFound('You are not registered for this auction');
    if (!['registered', 'active'].includes(participant.status)) {
      throw conflict('You are not active in this auction');
    }
    return participant;
  }

  private assertCanView(session: AuctionSessionFull, user?: AuthUser): void {
    if (user == null) throw forbidden('Authentication required');
    const isBuyer = session.request.buyerId === user.id;
    const isParticipant = session.participants.some((p) => p.sellerId === user.id);
    const isSellerBrowsing = user.role === 'seller' || user.role === 'admin';
    if (isBuyer || isParticipant || isSellerBrowsing || user.role === 'admin') return;
    throw forbidden('Insufficient permissions to view this auction');
  }
}

export default AuctionService;
