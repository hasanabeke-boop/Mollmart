import { Router } from 'express';
import ChatController from '../../controllers/chat.controller';
import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
  conversationIdParamSchema,
  conversationListSchema,
  createConversationSchema,
  messageListSchema,
  sendMessageSchema
} from '../../validators/chat.validation';

export function createChatRouter(controller: ChatController): Router {
  const router = Router();

  router.post('/conversations', authenticate, validate(createConversationSchema), asyncHandler(controller.createConversation));
  router.get('/conversations', authenticate, validate(conversationListSchema), asyncHandler(controller.listConversations));
  router.get('/conversations/:id', authenticate, validate(conversationIdParamSchema), asyncHandler(controller.getConversation));
  router.get('/conversations/:id/messages', authenticate, validate(messageListSchema), asyncHandler(controller.listMessages));
  router.post('/conversations/:id/messages', authenticate, validate(sendMessageSchema), asyncHandler(controller.sendMessage));
  router.post('/conversations/:id/read', authenticate, validate(conversationIdParamSchema), asyncHandler(controller.markRead));

  return router;
}

export default createChatRouter;
