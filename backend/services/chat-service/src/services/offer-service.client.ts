import config from '../config/config';
import { OfferSummary } from '../types/chat';
import { serviceUnavailable } from '../utils/apiError';

export interface OfferServiceClientLike {
  getOfferById(offerId: string): Promise<OfferSummary | null>;
}

export class OfferServiceClient implements OfferServiceClientLike {
  async getOfferById(offerId: string): Promise<OfferSummary | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.offerService.timeoutMs);

    try {
      const response = await fetch(`${config.offerService.url}/offers/${offerId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      if (response.status === 404 || response.status === 405) {
        return null;
      }

      if (!response.ok) {
        const body = await response.text();
        throw serviceUnavailable('Offer-service validation failed', {
          statusCode: response.status,
          response: body
        });
      }

      const payload = (await response.json()) as OfferSummary;
      return {
        id: payload.id,
        requestId: payload.requestId,
        sellerId: payload.sellerId,
        status: payload.status
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw serviceUnavailable('Offer-service request timed out');
      }

      if (error instanceof Error && error.message.includes('fetch failed')) {
        return null;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default OfferServiceClient;
