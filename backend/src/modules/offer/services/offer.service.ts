import config from '../../../config/config';
import { AuthUser } from '../types/express';
import { CreateOfferInput, OfferListQuery, OfferRequestListQuery, UpdateOfferInput } from '../types/offer';
import { badRequest, conflict, forbidden, notFound } from '../utils/apiError';
import { assertOfferEditable, assertOfferWithdrawable } from '../utils/offerState';
import { OfferEventPublisherLike } from './offer-event.service';
import { RequestModuleAdapterLike } from './request-module.adapter';
import {
  OfferRepositoryLike,
  OfferWithRelations,
  UpdateOfferRecordInput
} from '../repositories/offer.repository';

export class OfferService {
  constructor(
    private readonly offerRepository: OfferRepositoryLike,
    private readonly offerEventPublisher: OfferEventPublisherLike,
    private readonly requestModuleAdapter: RequestModuleAdapterLike
  ) {}

  async createOffer(user: AuthUser, input: CreateOfferInput): Promise<OfferWithRelations> {
    if (user.role !== 'seller') {
      throw forbidden('Only sellers can create offers');
    }

    this.validateOfferPayload(input);

    const request = await this.requestModuleAdapter.getRequestById(input.requestId, user);
    this.ensureRequestOpenForOffers(request.status, request.deadlineAt);

    if (request.buyerId === user.id) {
      throw badRequest('Request owner cannot submit an offer to their own request');
    }

    const acceptedOffer = await this.offerRepository.findAcceptedByRequest(input.requestId);
    if (acceptedOffer != null) {
      throw conflict('This request already has an accepted offer');
    }

    if (!config.offers.allowMultipleActivePerRequest) {
      const existingActiveOffer = await this.offerRepository.findActiveByRequestAndSeller(input.requestId, user.id);
      if (existingActiveOffer != null) {
        throw conflict('Seller already has an active offer for this request');
      }
    }

    const offer = await this.offerRepository.create(
      {
        requestId: input.requestId,
        sellerId: user.id,
        price: input.price,
        currency: input.currency.toUpperCase(),
        message: input.message.trim(),
        ...(input.deliveryDays !== undefined ? { deliveryDays: input.deliveryDays } : {}),
        ...(input.warrantyInfo !== undefined ? { warrantyInfo: input.warrantyInfo.trim() } : {})
      },
      user.id
    );

    await this.offerEventPublisher.publishOfferCreated(offer);
    return offer;
  }

  async updateOffer(user: AuthUser, offerId: string, input: UpdateOfferInput): Promise<OfferWithRelations> {
    if (user.role !== 'seller') {
      throw forbidden('Only sellers can update offers');
    }

    const current = await this.getOwnedOffer(user.id, offerId);
    assertOfferEditable(current.status);

    const request = await this.requestModuleAdapter.getRequestById(current.requestId, user);
    this.ensureRequestOpenForOffers(request.status, request.deadlineAt);

    const updatePayload = this.mapUpdateInput(input);
    if (Object.keys(updatePayload).length === 0) {
      throw badRequest('No valid offer fields supplied for update');
    }

    if (updatePayload.price != null && updatePayload.price <= 0) {
      throw badRequest('price must be greater than 0');
    }
    if (updatePayload.deliveryDays != null && updatePayload.deliveryDays <= 0) {
      throw badRequest('deliveryDays must be greater than 0');
    }

    const updated = await this.offerRepository.update(offerId, updatePayload, user.id, 'Updated by seller');
    await this.offerEventPublisher.publishOfferUpdated(updated);
    return updated;
  }

  async withdrawOffer(user: AuthUser, offerId: string): Promise<OfferWithRelations> {
    if (user.role !== 'seller') {
      throw forbidden('Only sellers can withdraw offers');
    }

    const current = await this.getOwnedOffer(user.id, offerId);
    assertOfferWithdrawable(current.status);

    const withdrawn = await this.offerRepository.transitionStatus(
      offerId,
      'withdrawn',
      user.id,
      'Withdrawn by seller'
    );

    await this.offerEventPublisher.publishOfferWithdrawn(withdrawn);
    return withdrawn;
  }

  async listOwnOffers(user: AuthUser, query: OfferListQuery) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers and admins can view submitted offers');
    }

    return this.offerRepository.listSellerOffers(user.id, query);
  }

  async listOffersForRequest(user: AuthUser, query: OfferRequestListQuery) {
    if (user.role !== 'buyer' && user.role !== 'admin') {
      throw forbidden('Only buyers and admins can view received offers');
    }

    const request = await this.requestModuleAdapter.getRequestById(query.requestId, user);
    if (user.role !== 'admin' && request.buyerId !== user.id) {
      throw forbidden('You can only view offers for your own requests');
    }

    return this.offerRepository.listByRequest(query.requestId, query);
  }

  async acceptOffer(user: AuthUser, offerId: string): Promise<OfferWithRelations> {
    if (user.role !== 'buyer') {
      throw forbidden('Only buyers can accept offers');
    }

    const target = await this.offerRepository.findById(offerId);
    if (target == null) {
      throw notFound('Offer not found');
    }

    const request = await this.requestModuleAdapter.getRequestById(target.requestId, user);
    if (request.buyerId !== user.id) {
      throw forbidden('Buyer can only accept offers for their own request');
    }

    if (target.status === 'accepted') {
      return target;
    }

    const acceptedForRequest = await this.offerRepository.findAcceptedByRequest(target.requestId);
    if (acceptedForRequest != null) {
      if (acceptedForRequest.id === offerId) {
        return acceptedForRequest;
      }

      throw conflict('Another offer has already been accepted for this request');
    }

    if (!['submitted', 'updated'].includes(target.status)) {
      throw badRequest(`Offer cannot be accepted while in "${target.status}" status`);
    }

    let result;
    try {
      result = await this.offerRepository.acceptOffer(offerId, user.id);
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFLICT_ACCEPTED_OFFER_EXISTS') {
        throw conflict('Another offer has already been accepted for this request');
      }

      throw error;
    }

    await this.offerEventPublisher.publishOfferAccepted(result.acceptedOffer);

    for (const rejected of result.rejectedOffers) {
      await this.offerEventPublisher.publishOfferRejected(rejected);
    }

    return result.acceptedOffer;
  }

  private async getOwnedOffer(sellerId: string, offerId: string): Promise<OfferWithRelations> {
    const offer = await this.offerRepository.findById(offerId);
    if (offer == null) {
      throw notFound('Offer not found');
    }

    if (offer.sellerId !== sellerId) {
      throw forbidden('You can only manage your own offers');
    }

    return offer;
  }

  private validateOfferPayload(input: CreateOfferInput): void {
    if (input.price <= 0) {
      throw badRequest('price must be greater than 0');
    }

    if (input.deliveryDays != null && input.deliveryDays <= 0) {
      throw badRequest('deliveryDays must be greater than 0');
    }
  }

  private ensureRequestOpenForOffers(status: string, deadlineAt: string | null): void {
    if (!['published', 'has_offers'].includes(status)) {
      throw badRequest('Offers can only be submitted to published requests that are open for offers');
    }

    if (deadlineAt != null && new Date(deadlineAt) < new Date()) {
      throw badRequest('Cannot create or update offers for expired requests');
    }
  }

  private mapUpdateInput(input: UpdateOfferInput): UpdateOfferRecordInput {
    const payload: UpdateOfferRecordInput = {};

    if (input.price !== undefined) {
      payload.price = input.price;
    }
    if (input.currency !== undefined) {
      payload.currency = input.currency.toUpperCase();
    }
    if (input.message !== undefined) {
      payload.message = input.message.trim();
    }
    if (input.deliveryDays !== undefined) {
      payload.deliveryDays = input.deliveryDays;
    }
    if (input.warrantyInfo !== undefined) {
      payload.warrantyInfo = input.warrantyInfo.trim().length > 0 ? input.warrantyInfo.trim() : null;
    }

    return payload;
  }
}

export default OfferService;
