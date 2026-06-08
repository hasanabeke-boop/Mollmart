import { Router } from 'express';
import ChatRepository from '../../../chat/repositories/chat.repository';
import ChatEventPublisher from '../../../chat/services/chat-event.service';
import ChatService from '../../../chat/services/chat.service';
import ChatOfferModuleAdapter from '../../../chat/services/offer-module.adapter';
import ChatRequestModuleAdapter from '../../../chat/services/request-module.adapter';
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
const chatService = new ChatService(
  new ChatRepository(),
  new ChatEventPublisher(),
  new ChatRequestModuleAdapter(),
  new ChatOfferModuleAdapter()
);
const offerService = new OfferService(offerRepository, offerEventPublisher, requestModuleAdapter, chatService);
const offerController = new OfferController(offerService);

router.use('/offers', createOfferRouter(offerController));

export default router;
