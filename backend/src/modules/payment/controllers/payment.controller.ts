import { Request, Response } from 'express';
import httpStatus from 'http-status';
import type { WorkspaceAuthUser } from '../../../shared/authenticateWorkspace';
import PaymentService from '../services/payment.service';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  config = async (_req: Request, res: Response): Promise<void> => {
    res.status(httpStatus.OK).json(this.paymentService.getConfig());
  };

  createCartCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      checkoutCurrency: string;
      shippingName?: string | null;
      shippingPhone?: string | null;
      shippingAddress?: string | null;
    };
    const data = await this.paymentService.createCartCheckoutSession(req.user as WorkspaceAuthUser, body);
    res.status(httpStatus.CREATED).json(data);
  };

  createRequestDealCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as { conversationId: string };
    const data = await this.paymentService.createRequestDealCheckoutSession(
      req.user as WorkspaceAuthUser,
      body.conversationId
    );
    res.status(httpStatus.CREATED).json(data);
  };

  stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    const event = this.paymentService.verifyWebhook(rawBody, req.header('stripe-signature'));
    await this.paymentService.handleStripeEvent(event);
    res.status(httpStatus.OK).json({ received: true });
  };
}

export default PaymentController;
