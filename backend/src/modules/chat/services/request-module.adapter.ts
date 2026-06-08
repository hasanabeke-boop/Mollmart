import RequestRepository from '../../request/repositories/request.repository';
import RequestEventPublisher, {
  RequestEventPublisherLike
} from '../../request/services/request-event.service';
import RequestService from '../../request/services/request.service';
import { AuthUser } from '../types/express';
import { RequestSummary } from '../types/chat';

export interface RequestModuleAdapterLike {
  getRequestById(requestId: string, user: AuthUser): Promise<RequestSummary>;
}

class InProcessRequestEventPublisher implements RequestEventPublisherLike {
  private readonly publisher = new RequestEventPublisher();

  publishRequestPublished = this.publisher.publishRequestPublished.bind(this.publisher);
  publishRequestUpdated = this.publisher.publishRequestUpdated.bind(this.publisher);
  publishRequestClosed = this.publisher.publishRequestClosed.bind(this.publisher);
  publishRequestAccepted = this.publisher.publishRequestAccepted.bind(this.publisher);
}

export class RequestModuleAdapter implements RequestModuleAdapterLike {
  private readonly requestService = new RequestService(
    new RequestRepository(),
    new InProcessRequestEventPublisher()
  );

  async getRequestById(requestId: string, user: AuthUser): Promise<RequestSummary> {
    const request = await this.requestService.getRequestById(user, requestId);

    return {
      id: request.id,
      buyerId: request.buyerId,
      status: request.status,
      deadlineAt: request.deadlineAt?.toISOString() ?? null
    };
  }
}

export default RequestModuleAdapter;
