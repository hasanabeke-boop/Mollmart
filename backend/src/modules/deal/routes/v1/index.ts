import { Router } from 'express';
import DealController from '../../controllers/deal.controller';
import DealEventPublisher from '../../services/deal-event.service';
import DealService from '../../services/deal.service';
import createDealRouter from './deal.route';

const router = Router();

const dealService = new DealService(new DealEventPublisher());
const dealController = new DealController(dealService);

router.use('/', createDealRouter(dealController));

export default router;
export { dealController, dealService };
