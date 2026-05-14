import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ChatbotService from '../services/chatbot.service';

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const reply = await this.chatbotService.createReply(req.body);
    res.status(httpStatus.OK).json(reply);
  };
}

export default ChatbotController;
