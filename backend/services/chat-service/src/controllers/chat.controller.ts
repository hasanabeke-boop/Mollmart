import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ChatService from '../services/chat.service';
import { ConversationListQuery, MessageListQuery } from '../types/chat';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  createConversation = async (req: Request, res: Response): Promise<void> => {
    const conversation = await this.chatService.openConversation(req.user!, req.body);
    res.status(httpStatus.CREATED).json(conversation);
  };

  listConversations = async (req: Request, res: Response): Promise<void> => {
    const result = await this.chatService.listConversations(
      req.user!,
      req.query as unknown as ConversationListQuery
    );
    res.status(httpStatus.OK).json(result);
  };

  getConversation = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const conversation = await this.chatService.getConversation(req.user!, conversationId);
    res.status(httpStatus.OK).json(conversation);
  };

  listMessages = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const result = await this.chatService.listMessages(
      req.user!,
      conversationId,
      req.query as unknown as MessageListQuery
    );
    res.status(httpStatus.OK).json(result);
  };

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const message = await this.chatService.sendMessage(req.user!, conversationId, req.body);
    res.status(httpStatus.CREATED).json(message);
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const messages = await this.chatService.markConversationRead(req.user!, conversationId);
    res.status(httpStatus.OK).json({
      markedCount: messages.length,
      messages
    });
  };

  closeConversation = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const conversation = await this.chatService.closeConversation(req.user!, conversationId);
    res.status(httpStatus.OK).json(conversation);
  };

  reopenConversation = async (req: Request, res: Response): Promise<void> => {
    const conversationId = requireParam(req.params.id, 'Conversation id');
    const conversation = await this.chatService.reopenConversation(req.user!, conversationId);
    res.status(httpStatus.OK).json(conversation);
  };
}

export default ChatController;
