import {
  Offer,
  OfferStatus,
  OfferStatusHistory,
  Prisma,
  PrismaClient
} from '@prisma/client';
import prisma from '../config/prisma';
import { OfferListQuery, OfferRequestListQuery, RequestListResult, StatusHistoryRecordInput } from '../types/offer';
import { buildPageMeta } from '../utils/pagination';

const offerInclude = {
  statusHistory: {
    orderBy: {
      createdAt: 'desc'
    }
  }
} satisfies Prisma.OfferInclude;

export type OfferWithRelations = Offer & {
  statusHistory: OfferStatusHistory[];
};

export interface CreateOfferRecordInput {
  requestId: string;
  sellerId: string;
  price: number;
  currency: string;
  message: string;
  deliveryDays?: number;
  warrantyInfo?: string;
}

export interface UpdateOfferRecordInput {
  price?: number;
  currency?: string;
  message?: string;
  deliveryDays?: number | null;
  warrantyInfo?: string | null;
}

export interface AcceptOfferResult {
  acceptedOffer: OfferWithRelations;
  rejectedOffers: OfferWithRelations[];
}

export interface OfferRepositoryLike {
  create(data: CreateOfferRecordInput, actorId: string): Promise<OfferWithRelations>;
  findById(id: string): Promise<OfferWithRelations | null>;
  findAcceptedByRequest(requestId: string): Promise<OfferWithRelations | null>;
  findActiveByRequestAndSeller(requestId: string, sellerId: string): Promise<OfferWithRelations | null>;
  update(id: string, data: UpdateOfferRecordInput, actorId: string, note?: string): Promise<OfferWithRelations>;
  transitionStatus(id: string, toStatus: OfferStatus, actorId: string, note?: string): Promise<OfferWithRelations>;
  acceptOffer(id: string, actorId: string): Promise<AcceptOfferResult>;
  listSellerOffers(sellerId: string, query: OfferListQuery): Promise<RequestListResult<OfferWithRelations>>;
  listByRequest(requestId: string, query: OfferRequestListQuery): Promise<RequestListResult<OfferWithRelations>>;
}

export class OfferRepository implements OfferRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(data: CreateOfferRecordInput, actorId: string): Promise<OfferWithRelations> {
    return this.client.offer.create({
      data: {
        requestId: data.requestId,
        sellerId: data.sellerId,
        price: data.price,
        currency: data.currency,
        message: data.message,
        ...(data.deliveryDays !== undefined ? { deliveryDays: data.deliveryDays } : {}),
        ...(data.warrantyInfo !== undefined ? { warrantyInfo: data.warrantyInfo } : {}),
        statusHistory: {
          create: {
            actorId,
            action: 'created',
            toStatus: 'submitted'
          }
        }
      },
      include: offerInclude
    });
  }

  async findById(id: string): Promise<OfferWithRelations | null> {
    return this.client.offer.findUnique({
      where: { id },
      include: offerInclude
    });
  }

  async findAcceptedByRequest(requestId: string): Promise<OfferWithRelations | null> {
    return this.client.offer.findFirst({
      where: {
        requestId,
        status: 'accepted'
      },
      include: offerInclude
    });
  }

  async findActiveByRequestAndSeller(requestId: string, sellerId: string): Promise<OfferWithRelations | null> {
    return this.client.offer.findFirst({
      where: {
        requestId,
        sellerId,
        status: {
          in: ['submitted', 'updated']
        }
      },
      include: offerInclude
    });
  }

  async update(
    id: string,
    data: UpdateOfferRecordInput,
    actorId: string,
    note?: string
  ): Promise<OfferWithRelations> {
    return this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.offer.findUniqueOrThrow({ where: { id } });

      await tx.offer.update({
        where: { id },
        data: {
          ...data,
          status: 'updated'
        }
      });

      await this.createHistoryRecord(tx, {
        offerId: id,
        actorId,
        fromStatus: current.status,
        toStatus: 'updated',
        action: 'updated',
        ...(note !== undefined ? { note } : {})
      });

      return tx.offer.findUniqueOrThrow({
        where: { id },
        include: offerInclude
      });
    });
  }

  async transitionStatus(
    id: string,
    toStatus: OfferStatus,
    actorId: string,
    note?: string
  ): Promise<OfferWithRelations> {
    return this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.offer.findUniqueOrThrow({
        where: { id }
      });

      await tx.offer.update({
        where: { id },
        data: {
          status: toStatus,
          ...(toStatus === 'accepted' ? { acceptedAt: new Date() } : {}),
          ...(toStatus === 'withdrawn' ? { withdrawnAt: new Date() } : {})
        }
      });

      await this.createHistoryRecord(tx, {
        offerId: id,
        actorId,
        fromStatus: current.status,
        toStatus,
        action:
          toStatus === 'withdrawn'
            ? 'withdrawn'
            : toStatus === 'accepted'
              ? 'accepted'
              : toStatus === 'rejected'
                ? 'rejected'
                : 'expired',
        ...(note !== undefined ? { note } : {})
      });

      return tx.offer.findUniqueOrThrow({
        where: { id },
        include: offerInclude
      });
    });
  }

  async acceptOffer(id: string, actorId: string): Promise<AcceptOfferResult> {
    return this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const target = await tx.offer.findUniqueOrThrow({
        where: { id }
      });

      const existingAccepted = await tx.offer.findFirst({
        where: {
          requestId: target.requestId,
          status: 'accepted'
        }
      });

      if (existingAccepted != null && existingAccepted.id !== id) {
        throw new Error('CONFLICT_ACCEPTED_OFFER_EXISTS');
      }

      if (target.status === 'accepted') {
        return {
          acceptedOffer: await tx.offer.findUniqueOrThrow({
            where: { id },
            include: offerInclude
          }),
          rejectedOffers: []
        };
      }

      await tx.offer.update({
        where: { id },
        data: {
          status: 'accepted',
          acceptedAt: new Date()
        }
      });

      await this.createHistoryRecord(tx, {
        offerId: id,
        actorId,
        fromStatus: target.status,
        toStatus: 'accepted',
        action: 'accepted',
        note: 'Accepted by request owner'
      });

      const competingOffers = await tx.offer.findMany({
        where: {
          requestId: target.requestId,
          id: {
            not: id
          },
          status: {
            in: ['submitted', 'updated']
          }
        }
      });

      if (competingOffers.length > 0) {
        await tx.offer.updateMany({
          where: {
            id: {
              in: competingOffers.map((offer) => offer.id)
            }
          },
          data: {
            status: 'rejected'
          }
        });

        await tx.offerStatusHistory.createMany({
          data: competingOffers.map((offer) => ({
            offerId: offer.id,
            actorId,
            fromStatus: offer.status,
            toStatus: 'rejected',
            action: 'rejected',
            note: 'Rejected because another offer was accepted'
          }))
        });
      }

      const acceptedOffer = await tx.offer.findUniqueOrThrow({
        where: { id },
        include: offerInclude
      });

      const rejectedOffers =
        competingOffers.length > 0
          ? await tx.offer.findMany({
              where: {
                id: {
                  in: competingOffers.map((offer) => offer.id)
                }
              },
              include: offerInclude
            })
          : [];

      return {
        acceptedOffer,
        rejectedOffers
      };
    });
  }

  async listSellerOffers(
    sellerId: string,
    query: OfferListQuery
  ): Promise<RequestListResult<OfferWithRelations>> {
    const where: Prisma.OfferWhereInput = {
      sellerId,
      ...(query.requestId != null ? { requestId: query.requestId } : {}),
      ...(query.status != null ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.client.offer.findMany({
        where,
        include: offerInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      this.client.offer.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(query.page, query.limit, total)
    };
  }

  async listByRequest(
    requestId: string,
    query: OfferRequestListQuery
  ): Promise<RequestListResult<OfferWithRelations>> {
    const where: Prisma.OfferWhereInput = {
      requestId,
      ...(query.status != null ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.client.offer.findMany({
        where,
        include: offerInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      this.client.offer.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(query.page, query.limit, total)
    };
  }

  private async createHistoryRecord(
    tx: Prisma.TransactionClient,
    input: StatusHistoryRecordInput
  ): Promise<void> {
    await tx.offerStatusHistory.create({
      data: input
    });
  }
}

export default OfferRepository;
