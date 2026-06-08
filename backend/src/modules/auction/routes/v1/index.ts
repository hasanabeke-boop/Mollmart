import { Router } from 'express';
import AuctionController from '../../controllers/auction.controller';
import { auctionService } from '../../bootstrap';
import { createAuctionRouter } from './auction.route';

const router = Router();
const controller = new AuctionController(auctionService);

router.use('/auctions', createAuctionRouter(controller));

export default router;
