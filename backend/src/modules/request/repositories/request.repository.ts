import {
  Prisma,
  PrismaClient,
  Request,
  RequestAttachment,
  RequestStatus,
  RequestStatusHistory
} from '@prisma/client';
import prisma from '../../../config/prisma';
import { buildPageMeta } from '../utils/pagination';
import { OwnerRequestQuery, RequestBoardQuery, RequestListResult, StatusHistoryRecordInput } from '../types/request';

const requestDetailsInclude = {
  attachments: true,
  statusHistory: {
    orderBy: {
      createdAt: 'desc'
    }
  }
} satisfies Prisma.RequestInclude;

export type RequestWithRelations = Request & {
  attachments: RequestAttachment[];
  statusHistory: RequestStatusHistory[];
};

export interface CreateRequestRecordInput {
  buyerId: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  location?: string;
  deadlineAt?: Date;
  isNegotiable: boolean;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  }>;
}

export interface UpdateRequestRecordInput {
  title?: string;
  description?: string;
  categoryId?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string;
  location?: string | null;
  deadlineAt?: Date | null;
  isNegotiable?: boolean;
}

export interface RequestRepositoryLike {
  createDraft(data: CreateRequestRecordInput, actorId: string): Promise<RequestWithRelations>;
  findById(id: string): Promise<RequestWithRelations | null>;
  publish(id: string, actorId: string, note?: string): Promise<RequestWithRelations>;
  update(id: string, data: UpdateRequestRecordInput, actorId: string, note?: string): Promise<RequestWithRelations>;
  transitionStatus(id: string, toStatus: RequestStatus, actorId: string, note?: string): Promise<RequestWithRelations>;
  listOwnerRequests(buyerId: string, query: OwnerRequestQuery): Promise<RequestListResult<RequestWithRelations>>;
  listSellerBoard(query: RequestBoardQuery): Promise<RequestListResult<RequestWithRelations>>;
}

export class RequestRepository implements RequestRepositoryLike {
  constructor(private readonly client: PrismaClient = prisma) {}

  async createDraft(data: CreateRequestRecordInput, actorId: string): Promise<RequestWithRelations> {
    return this.client.request.create({
      data: {
        buyerId: data.buyerId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        currency: data.currency,
        isNegotiable: data.isNegotiable,
        ...(data.budgetMin !== undefined ? { budgetMin: data.budgetMin } : {}),
        ...(data.budgetMax !== undefined ? { budgetMax: data.budgetMax } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.deadlineAt !== undefined ? { deadlineAt: data.deadlineAt } : {}),
        attachments: {
          create: data.attachments
        },
        statusHistory: {
          create: {
            actorId,
            action: 'created',
            toStatus: 'draft'
          }
        }
      },
      include: requestDetailsInclude
    });
  }

  async findById(id: string): Promise<RequestWithRelations | null> {
    return this.client.request.findUnique({
      where: { id },
      include: requestDetailsInclude
    });
  }

  async publish(id: string, actorId: string, note?: string): Promise<RequestWithRelations> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({
        where: { id }
      });

      await tx.request.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date()
        }
      });

      await this.createHistoryRecord(tx, {
        requestId: id,
        actorId,
        action: 'published',
        fromStatus: current.status,
        toStatus: 'published',
        ...(note !== undefined ? { note } : {})
      });

      return tx.request.findUniqueOrThrow({
        where: { id },
        include: requestDetailsInclude
      });
    });
  }

  async update(
    id: string,
    data: UpdateRequestRecordInput,
    actorId: string,
    note?: string
  ): Promise<RequestWithRelations> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({
        where: { id }
      });

      await tx.request.update({
        where: { id },
        data
      });

      await this.createHistoryRecord(tx, {
        requestId: id,
        actorId,
        action: 'updated',
        fromStatus: current.status,
        toStatus: current.status,
        ...(note !== undefined ? { note } : {})
      });

      return tx.request.findUniqueOrThrow({
        where: { id },
        include: requestDetailsInclude
      });
    });
  }

  async transitionStatus(
    id: string,
    toStatus: RequestStatus,
    actorId: string,
    note?: string
  ): Promise<RequestWithRelations> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({
        where: { id }
      });

      await tx.request.update({
        where: { id },
        data: {
          status: toStatus,
          closedAt: toStatus === 'closed' || toStatus === 'cancelled' ? new Date() : current.closedAt
        }
      });

      await this.createHistoryRecord(tx, {
        requestId: id,
        actorId,
        fromStatus: current.status,
        toStatus,
        action: this.resolveHistoryAction(toStatus),
        ...(note !== undefined ? { note } : {})
      });

      return tx.request.findUniqueOrThrow({
        where: { id },
        include: requestDetailsInclude
      });
    });
  }

  async listOwnerRequests(
    buyerId: string,
    query: OwnerRequestQuery
  ): Promise<RequestListResult<RequestWithRelations>> {
    const where: Prisma.RequestWhereInput = {
      buyerId,
      ...(query.status != null ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.client.request.findMany({
        where,
        include: requestDetailsInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      this.client.request.count({ where })
    ]);

    return {
      items,
      meta: buildPageMeta(query.page, query.limit, total)
    };
  }

  async listSellerBoard(query: RequestBoardQuery): Promise<RequestListResult<RequestWithRelations>> {
    const now = new Date();
    const andFilters: Prisma.RequestWhereInput[] = [{ OR: [{ deadlineAt: null }, { deadlineAt: { gte: now } }] }];

    if (query.q != null) {
      andFilters.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ]
      });
    }

    const where: Prisma.RequestWhereInput = {
      status: {
        in: ['published', 'has_offers']
      },
      AND: andFilters,
      ...(query.categoryId != null ? { categoryId: query.categoryId } : {}),
      ...(query.currency != null ? { currency: query.currency } : {}),
      ...(query.location != null ? { location: { contains: query.location, mode: 'insensitive' } } : {}),
      ...(query.isNegotiable != null ? { isNegotiable: query.isNegotiable } : {}),
      ...(query.budgetMin != null ? { budgetMax: { gte: query.budgetMin } } : {}),
      ...(query.budgetMax != null ? { budgetMin: { lte: query.budgetMax } } : {}),
      ...(query.deadlineFrom != null || query.deadlineTo != null
        ? {
            deadlineAt: {
              ...(query.deadlineFrom != null ? { gte: new Date(query.deadlineFrom) } : {}),
              ...(query.deadlineTo != null ? { lte: new Date(query.deadlineTo) } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.client.request.findMany({
        where,
        include: requestDetailsInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      this.client.request.count({ where })
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
    await tx.requestStatusHistory.create({
      data: input
    });
  }

  private resolveHistoryAction(toStatus: RequestStatus): StatusHistoryRecordInput['action'] {
    switch (toStatus) {
      case 'published':
        return 'published';
      case 'has_offers':
        return 'moved_to_has_offers';
      case 'in_negotiation':
        return 'moved_to_negotiation';
      case 'accepted':
        return 'accepted';
      case 'closed':
        return 'closed';
      case 'cancelled':
        return 'cancelled';
      case 'draft':
      default:
        return 'updated';
    }
  }
}

export default RequestRepository;
