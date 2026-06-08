import OfferRepository from '../../offer/repositories/offer.repository';
import { OfferSummary } from '../types/chat';

export interface OfferModuleAdapterLike {
  getOfferById(offerId: string): Promise<OfferSummary | null>;
}

export class OfferModuleAdapter implements OfferModuleAdapterLike {
  private readonly offerRepository = new OfferRepository();

  async getOfferById(offerId: string): Promise<OfferSummary | null> {
    const offer = await this.offerRepository.findById(offerId);

    if (offer == null) {
      return null;
    }

    return {
      id: offer.id,
      requestId: offer.requestId,
      sellerId: offer.sellerId,
      status: offer.status
    };
  }
}

export default OfferModuleAdapter;
