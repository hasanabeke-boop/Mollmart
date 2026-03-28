import config from '../config/config';
import { AuthUser } from '../types/express';
import { RequestSummary } from '../types/offer';
import { notFound, serviceUnavailable } from '../utils/apiError';

export interface RequestServiceClientLike {
  getRequestById(requestId: string, user: AuthUser): Promise<RequestSummary>;
}

export class RequestServiceClient implements RequestServiceClientLike {
  async getRequestById(requestId: string, user: AuthUser): Promise<RequestSummary> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.requestService.timeoutMs);

    try {
      const headers = new Headers({
        Accept: 'application/json',
        'x-user-id': user.id,
        'x-user-role': user.role
      });

      if (user.token != null) {
        headers.set('authorization', `Bearer ${user.token}`);
      }

      const response = await fetch(`${config.requestService.url}/requests/${requestId}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      if (response.status === 404) {
        throw notFound('Request not found');
      }

      if (!response.ok) {
        const body = await response.text();
        throw serviceUnavailable('Request-service validation failed', {
          statusCode: response.status,
          response: body
        });
      }

      const payload = (await response.json()) as RequestSummary;
      return {
        id: payload.id,
        buyerId: payload.buyerId,
        status: payload.status,
        deadlineAt: payload.deadlineAt
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw serviceUnavailable('Request-service request timed out');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default RequestServiceClient;
