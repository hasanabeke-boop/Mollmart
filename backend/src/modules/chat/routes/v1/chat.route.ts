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

  router.use(authenticate);

  router.post('/conversations', validate(createConversationSchema), asyncHandler(controller.createConversation));
  router.get('/conversations', validate(conversationListSchema), asyncHandler(controller.listConversations));
  router.get('/conversations/:id', validate(conversationIdParamSchema), asyncHandler(controller.getConversation));
  router.get('/conversations/:id/messages', validate(messageListSchema), asyncHandler(controller.listMessages));
  router.post('/conversations/:id/messages', validate(sendMessageSchema), asyncHandler(controller.sendMessage));
  router.post('/conversations/:id/read', validate(conversationIdParamSchema), asyncHandler(controller.markRead));

  return router;
}

export default createChatRouter;
