import { Router } from 'express';
import PaymentController from '../../controllers/payment.controller';
import PaymentService from '../../services/payment.service';
import { createPaymentRouter, createPaymentWebhookRouter } from './payment.route';

const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

const router = Router();
router.use('/', createPaymentRouter(paymentController));

const webhookRouter = Router();
webhookRouter.use('/', createPaymentWebhookRouter(paymentController));

export default router;
export { paymentController, paymentService, webhookRouter };
