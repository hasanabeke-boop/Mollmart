import { Router } from 'express';
import ChatController from '../../controllers/chat.controller';
import ChatRepository from '../../repositories/chat.repository';
import ChatEventPublisher from '../../services/chat-event.service';
import ChatService from '../../services/chat.service';
import OfferModuleAdapter from '../../services/offer-module.adapter';
import RequestModuleAdapter from '../../services/request-module.adapter';
import { createChatRouter } from './chat.route';

const router = Router();

const chatRepository = new ChatRepository();
const chatEventPublisher = new ChatEventPublisher();
const requestModuleAdapter = new RequestModuleAdapter();
const offerModuleAdapter = new OfferModuleAdapter();
const chatService = new ChatService(
  chatRepository,
  chatEventPublisher,
  requestModuleAdapter,
  offerModuleAdapter
);
const chatController = new ChatController(chatService);

router.use('/', createChatRouter(chatController));

export default router;
