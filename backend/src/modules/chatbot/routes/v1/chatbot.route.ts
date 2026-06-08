import { Router } from 'express';
import ChatbotController from '../../controllers/chatbot.controller';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import { chatbotMessageSchema } from '../../validators/chatbot.validation';

export function createChatbotRouter(controller: ChatbotController): Router {
  const router = Router();

  router.post('/chatbot/message', validate(chatbotMessageSchema), asyncHandler(controller.sendMessage));

  return router;
}

export default createChatbotRouter;
