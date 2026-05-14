import { Router } from 'express';
import ChatbotController from '../../controllers/chatbot.controller';
import ChatbotService from '../../services/chatbot.service';
import { createChatbotRouter } from './chatbot.route';

const router = Router();

const chatbotService = new ChatbotService();
const chatbotController = new ChatbotController(chatbotService);

router.use('/', createChatbotRouter(chatbotController));

export default router;
