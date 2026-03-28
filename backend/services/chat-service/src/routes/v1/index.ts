import { Router } from 'express';
import ChatController from '../../controllers/chat.controller';
import ChatRepository from '../../repositories/chat.repository';
import ChatEventPublisher from '../../services/chat-event.service';
import ChatService from '../../services/chat.service';
import OfferServiceClient from '../../services/offer-service.client';
import RequestServiceClient from '../../services/request-service.client';
import { createChatRouter } from './chat.route';

const router = Router();

const chatRepository = new ChatRepository();
const chatEventPublisher = new ChatEventPublisher();
const requestServiceClient = new RequestServiceClient();
const offerServiceClient = new OfferServiceClient();
const chatService = new ChatService(
  chatRepository,
  chatEventPublisher,
  requestServiceClient,
  offerServiceClient
);
const chatController = new ChatController(chatService);

router.use('/', createChatRouter(chatController));

export default router;
