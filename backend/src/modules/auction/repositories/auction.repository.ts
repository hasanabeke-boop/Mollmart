import { AuctionSessionStatus, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../config/prisma';

const sessionInclude = {
  request: {
    select: {
      id: true,
      title: true,
      buyerId: true,
      currency: true,
      quantity: true,
      budgetMax: true,
      status: true,
      deadlineAt: true
    }
  },
  participants: {
    include: {
      seller: { select: { id: true, name: true } }
    },
    orderBy: { currentPrice: 'asc' as const }
  },
  bidEvents: {
    orderBy: { createdAt: 'desc' as const },
    take: 30
  }
} satisfies Prisma.AuctionSessionInclude;

export type AuctionSessionFull = Prisma.AuctionSessionGetPayload<{ include: typeof sessionInclude }>;

export type ParticipateInput = {
  startPrice: number;
  floorPrice: number;
  deliveryDays?: number;
  message?: string;
};

export class AuctionRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByRequestId(requestId: string): Promise<AuctionSessionFull | null> {
    return this.client.auctionSession.findUnique({
      where: { requestId },
      include: sessionInclude
    });
  }

  async findById(sessionId: string): Promise<AuctionSessionFull | null> {
    return this.client.auctionSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude
    });
  }

  async createForRequest(requestId: string): Promise<AuctionSessionFull> {
    return this.client.auctionSession.create({
      data: { requestId },
      include: sessionInclude
    });
  }

  async listSellerSessions(
    sellerId: string,
    statuses: AuctionSessionStatus[]
  ): Promise<AuctionSessionFull[]> {
    return this.client.auctionSession.findMany({
      where: {
        status: { in: statuses },
        participants: { some: { sellerId } }
      },
      include: sessionInclude,
      orderBy: [{ scheduledAt: 'asc' }, { roundEndsAt: 'asc' }]
    });
  }

  async listDueScheduled(now: Date): Promise<AuctionSessionFull[]> {
    return this.client.auctionSession.findMany({
      where: { status: 'scheduled', scheduledAt: { lte: now } },
      include: sessionInclude
    });
  }

  async listDueRoundEnd(now: Date): Promise<AuctionSessionFull[]> {
    return this.client.auctionSession.findMany({
      where: {
        status: 'live',
        roundPausedUntil: null,
        roundEndsAt: { lte: now }
      },
      include: sessionInclude
    });
  }

  async listDueRoundResume(now: Date): Promise<AuctionSessionFull[]> {
    return this.client.auctionSession.findMany({
      where: {
        status: 'live',
        roundPausedUntil: { lte: now }
      },
      include: sessionInclude
    });
  }

  async addParticipant(
    sessionId: string,
    sellerId: string,
    input: ParticipateInput,
    currency: string
  ): Promise<AuctionSessionFull> {
    return this.client.$transaction(async (tx) => {
      await tx.auctionParticipant.create({
        data: {
          sessionId,
          sellerId,
          startPrice: input.startPrice,
          floorPrice: input.floorPrice,
          currentPrice: input.startPrice,
          currency,
          ...(input.deliveryDays != null ? { deliveryDays: input.deliveryDays } : {}),
          ...(input.message != null ? { message: input.message.trim() } : {})
        }
      });

      return tx.auctionSession.update({
        where: { id: sessionId },
        data: { participantCount: { increment: 1 } },
        include: sessionInclude
      });
    });
  }

  async updateSession(
    sessionId: string,
    data: Prisma.AuctionSessionUpdateInput
  ): Promise<AuctionSessionFull> {
    return this.client.auctionSession.update({
      where: { id: sessionId },
      data,
      include: sessionInclude
    });
  }

  async updateParticipant(
    participantId: string,
    data: Prisma.AuctionParticipantUpdateInput
  ): Promise<void> {
    await this.client.auctionParticipant.update({ where: { id: participantId }, data });
  }

  async findParticipant(sessionId: string, sellerId: string) {
    return this.client.auctionParticipant.findUnique({
      where: { sessionId_sellerId: { sessionId, sellerId } }
    });
  }

  async recordBidEvent(input: {
    sessionId: string;
    sellerId: string;
    roundNumber: number;
    priceBefore: number;
    priceAfter: number;
    eventType: string;
  }): Promise<void> {
    await this.client.auctionBidEvent.create({ data: input });
  }

  async resetRoundFlags(sessionId: string): Promise<void> {
    await this.client.auctionParticipant.updateMany({
      where: { sessionId, status: { in: ['registered', 'active'] } },
      data: { actedThisRound: false }
    });
  }

  async markParticipantsActive(sessionId: string): Promise<void> {
    await this.client.auctionParticipant.updateMany({
      where: { sessionId, status: 'registered' },
      data: { status: 'active' }
    });
  }

  async countActiveParticipants(sessionId: string): Promise<number> {
    return this.client.auctionParticipant.count({
      where: { sessionId, status: { in: ['registered', 'active'] } }
    });
  }

  async getLeader(sessionId: string) {
    return this.client.auctionParticipant.findFirst({
      where: { sessionId, status: 'active' },
      orderBy: [{ currentPrice: 'asc' }, { registeredAt: 'asc' }]
    });
  }

  async countLowerEventsInRound(sessionId: string, roundNumber: number): Promise<number> {
    return this.client.auctionBidEvent.count({
      where: { sessionId, roundNumber, eventType: 'lower' }
    });
  }
}

export default AuctionRepository;
