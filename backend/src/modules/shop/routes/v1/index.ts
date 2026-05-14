import { Router } from 'express';
import ShopController from '../../controllers/shop.controller';
import ShopRepository from '../../repositories/shop.repository';
import ShopService from '../../services/shop.service';
import { createShopRouter } from './shop.route';

const shopRepository = new ShopRepository();
const shopService = new ShopService(shopRepository);
const shopController = new ShopController(shopService);

const router = Router();
router.use('/', createShopRouter(shopController));

export default router;
