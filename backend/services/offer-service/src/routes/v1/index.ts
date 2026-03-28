import { Router } from 'express';
import OfferController from '../../controllers/offer.controller';
import OfferRepository from '../../repositories/offer.repository';
import OfferEventPublisher from '../../services/offer-event.service';
import OfferService from '../../services/offer.service';
import RequestServiceClient from '../../services/request-service.client';
import { createOfferRouter } from './offer.route';

const router = Router();

const offerRepository = new OfferRepository();
const offerEventPublisher = new OfferEventPublisher();
const requestServiceClient = new RequestServiceClient();
const offerService = new OfferService(offerRepository, offerEventPublisher, requestServiceClient);
const offerController = new OfferController(offerService);

router.use('/offers', createOfferRouter(offerController));

export default router;
