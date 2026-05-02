import { RequestStatus } from '@prisma/client';
import { forbidden, notFound, badRequest } from '../utils/apiError';
import { AuthUser } from '../types/express';
import {
  CreateRequestInput,
  OwnerRequestQuery,
  RequestBoardQuery,
  UpdateRequestInput
} from '../types/request';
import {
  RequestRepositoryLike,
  RequestWithRelations,
  UpdateRequestRecordInput
} from '../repositories/request.repository';
import {
  assertPublishedRequestUpdateAllowed,
  assertRequestEditable,
  ensureTransitionAllowed
} from '../utils/requestState';
import { RequestEventPublisherLike } from './request-event.service';

export class RequestService {
  constructor(
    private readonly requestRepository: RequestRepositoryLike,
    private readonly requestEventPublisher: RequestEventPublisherLike
  ) {}

  async createRequest(user: AuthUser, input: CreateRequestInput): Promise<RequestWithRelations> {
    if (user.role !== 'buyer') {
      throw forbidden('Only buyers can create requests');
    }

    this.validateBudgetRange(input.budgetMin, input.budgetMax);
    this.validateDeadline(input.deadlineAt);

    return this.requestRepository.createDraft({
      buyerId: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      categoryId: input.categoryId.trim(),
      currency: input.currency.toUpperCase(),
      isNegotiable: input.isNegotiable ?? false,
      attachments: input.attachments ?? [],
      ...(input.budgetMin !== undefined ? { budgetMin: input.budgetMin } : {}),
      ...(input.budgetMax !== undefined ? { budgetMax: input.budgetMax } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() } : {}),
      ...(input.deadlineAt != null ? { deadlineAt: new Date(input.deadlineAt) } : {})
    }, user.id);
  }

  async publishRequest(user: AuthUser, requestId: string): Promise<RequestWithRelations> {
    const request = await this.getOwnedRequest(user, requestId);
    this.ensurePublishable(request);

    const publishedRequest = await this.requestRepository.publish(requestId, user.id, 'Published by buyer');
    await this.requestEventPublisher.publishRequestPublished(publishedRequest);
    return publishedRequest;
  }

  async listOwnRequests(user: AuthUser, query: OwnerRequestQuery) {
    return this.requestRepository.listOwnerRequests(user.id, query);
  }

  async listSellerBoard(user: AuthUser, query: RequestBoardQuery) {
    if (!['seller', 'admin'].includes(user.role)) {
      throw forbidden('Only sellers and admins can browse the request board');
    }

    return this.requestRepository.listSellerBoard(query);
  }

  async getRequestById(user: AuthUser, requestId: string): Promise<RequestWithRelations> {
    const request = await this.requestRepository.findById(requestId);
    if (request == null) {
      throw notFound('Request not found');
    }

    if (user.role === 'admin' || request.buyerId === user.id) {
      return request;
    }

    const visibleToSeller = ['published', 'has_offers'].includes(request.status);
    const deadlineStillOpen = request.deadlineAt == null || request.deadlineAt >= new Date();

    if (user.role === 'seller' && visibleToSeller && deadlineStillOpen) {
      return request;
    }

    throw forbidden('You do not have access to this request');
  }

  async updateRequest(
    user: AuthUser,
    requestId: string,
    input: UpdateRequestInput
  ): Promise<RequestWithRelations> {
    const current = await this.getOwnedRequest(user, requestId);
    assertRequestEditable(current.status);

    this.validateBudgetRange(input.budgetMin, input.budgetMax);
    this.validateDeadline(input.deadlineAt);

    if (current.status !== 'draft') {
      assertPublishedRequestUpdateAllowed(input, current.offerCount > 0 || current.status === 'has_offers');
    }

    const updatePayload = this.mapUpdateInput(input);
    if (Object.keys(updatePayload).length === 0) {
      throw badRequest('No valid request fields supplied for update');
    }

    const updatedRequest = await this.requestRepository.update(
      requestId,
      updatePayload,
      user.id,
      'Updated by buyer'
    );

    if (updatedRequest.status !== 'draft') {
      await this.requestEventPublisher.publishRequestUpdated(updatedRequest);
    }

    return updatedRequest;
  }

  async closeRequest(user: AuthUser, requestId: string): Promise<RequestWithRelations> {
    const current = await this.getOwnedRequest(user, requestId);
    ensureTransitionAllowed(current.status, 'closed');

    const closedRequest = await this.requestRepository.transitionStatus(
      requestId,
      'closed',
      user.id,
      'Closed by buyer'
    );

    await this.requestEventPublisher.publishRequestClosed(closedRequest);
    return closedRequest;
  }

  async cancelRequest(user: AuthUser, requestId: string): Promise<RequestWithRelations> {
    const current = await this.getOwnedRequest(user, requestId);
    ensureTransitionAllowed(current.status, 'cancelled');

    return this.requestRepository.transitionStatus(requestId, 'cancelled', user.id, 'Cancelled by buyer');
  }

  async transitionSystemStatus(
    actorId: string,
    requestId: string,
    toStatus: Extract<RequestStatus, 'has_offers' | 'in_negotiation' | 'accepted'>
  ): Promise<RequestWithRelations> {
    const current = await this.requestRepository.findById(requestId);
    if (current == null) {
      throw notFound('Request not found');
    }

    ensureTransitionAllowed(current.status, toStatus);

    const updated = await this.requestRepository.transitionStatus(
      requestId,
      toStatus,
      actorId,
      'System status transition'
    );

    if (toStatus === 'accepted') {
      await this.requestEventPublisher.publishRequestAccepted(updated);
    }

    return updated;
  }

  private async getOwnedRequest(user: AuthUser, requestId: string): Promise<RequestWithRelations> {
    const request = await this.requestRepository.findById(requestId);
    if (request == null) {
      throw notFound('Request not found');
    }

    if (user.role === 'admin' || request.buyerId === user.id) {
      return request;
    }

    throw forbidden('You can only manage your own requests');
  }

  private ensurePublishable(request: RequestWithRelations): void {
    if (request.status !== 'draft') {
      throw badRequest('Only draft requests can be published');
    }

    if (request.title.trim().length === 0 || request.description.trim().length === 0) {
      throw badRequest('Request must include title and description before publishing');
    }

    if (request.deadlineAt != null && request.deadlineAt <= new Date()) {
      throw badRequest('Request deadline must be in the future before publishing');
    }
  }

  private validateBudgetRange(budgetMin?: number, budgetMax?: number): void {
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      throw badRequest('budgetMin cannot be greater than budgetMax');
    }
  }

  private validateDeadline(deadlineAt?: string): void {
    if (deadlineAt == null) {
      return;
    }

    const date = new Date(deadlineAt);
    if (Number.isNaN(date.getTime())) {
      throw badRequest('deadlineAt must be a valid ISO date string');
    }
  }

  private mapUpdateInput(input: UpdateRequestInput): UpdateRequestRecordInput {
    const updatePayload: UpdateRequestRecordInput = {};

    if (input.title !== undefined) {
      updatePayload.title = input.title.trim();
    }
    if (input.description !== undefined) {
      updatePayload.description = input.description.trim();
    }
    if (input.categoryId !== undefined) {
      updatePayload.categoryId = input.categoryId.trim();
    }
    if (input.budgetMin !== undefined) {
      updatePayload.budgetMin = input.budgetMin;
    }
    if (input.budgetMax !== undefined) {
      updatePayload.budgetMax = input.budgetMax;
    }
    if (input.currency !== undefined) {
      updatePayload.currency = input.currency.toUpperCase();
    }
    if (input.location !== undefined) {
      updatePayload.location = input.location.trim().length > 0 ? input.location.trim() : null;
    }
    if (input.deadlineAt !== undefined) {
      updatePayload.deadlineAt = input.deadlineAt.length > 0 ? new Date(input.deadlineAt) : null;
    }
    if (input.isNegotiable !== undefined) {
      updatePayload.isNegotiable = input.isNegotiable;
    }

    return updatePayload;
  }
}

export default RequestService;
