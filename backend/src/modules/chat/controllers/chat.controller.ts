import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ChatService from '../services/chat.service';
import { ConversationListQuery, MessageListQuery } from '../types/chat';

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
    const conversation = await this.chatService.getConversation(req.user!, req.params.id);
    res.status(httpStatus.OK).json(conversation);
  };

  listMessages = async (req: Request, res: Response): Promise<void> => {
    const result = await this.chatService.listMessages(
      req.user!,
      req.params.id,
      req.query as unknown as MessageListQuery
    );
    res.status(httpStatus.OK).json(result);
  };

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const message = await this.chatService.sendMessage(req.user!, req.params.id, req.body);
    res.status(httpStatus.CREATED).json(message);
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const messages = await this.chatService.markConversationRead(req.user!, req.params.id);
    res.status(httpStatus.OK).json({
      markedCount: messages.length,
      messages
    });
  };
}

export default ChatController;
