import { Router } from 'express';
import OfferController from '../../controllers/offer.controller';
import OfferRepository from '../../repositories/offer.repository';
import OfferEventPublisher from '../../services/offer-event.service';
import OfferService from '../../services/offer.service';
import RequestModuleAdapter from '../../services/request-module.adapter';
import { createOfferRouter } from './offer.route';

const router = Router();

const offerRepository = new OfferRepository();
const offerEventPublisher = new OfferEventPublisher();
const requestModuleAdapter = new RequestModuleAdapter();
const offerService = new OfferService(offerRepository, offerEventPublisher, requestModuleAdapter);
const offerController = new OfferController(offerService);

router.use('/offers', createOfferRouter(offerController));

export default router;
