import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { auctionRulesTooltips } from '../../../config/auctionRules';
import { AuthUser } from '../../request/types/express';
import { dealService } from '../../deal/routes/v1/index';
import AuctionService from '../services/auction.service';
import { auctionEventHub } from '../services/auction-event-hub';

export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  getRules = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      rules: this.auctionService.getRules(),
      tooltips: auctionRulesTooltips
    });
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.listMine(req.user as AuthUser);
    res.json(data);
  };

  getByRequest = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.getByRequestId(req.params.requestId, req.user as AuthUser);
    res.json(data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.getById(req.params.sessionId, req.user as AuthUser);
    res.json(data);
  };

  participate = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.participate(
      req.user as AuthUser,
      req.params.requestId,
      req.body
    );
    res.status(201).json(data);
  };

  lower = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.lowerPrice(req.user as AuthUser, req.params.sessionId);
    res.json(data);
  };

  hold = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.hold(req.user as AuthUser, req.params.sessionId);
    res.json(data);
  };

  withdraw = async (req: Request, res: Response): Promise<void> => {
    const data = await this.auctionService.withdraw(req.user as AuthUser, req.params.sessionId);
    res.json(data);
  };

  placeWinnerOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await dealService.placeAuctionWinnerOrder(
      req.user as AuthUser,
      req.params.requestId,
      req.body
    );
    res.status(httpStatus.CREATED).json(data);
  };

  stream = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.params.sessionId;
    const user = req.user as AuthUser;
    const snapshot = await this.auctionService.getById(sessionId, user);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event: { type: string; payload: Record<string, unknown>; at?: string }) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    send({ type: 'state', payload: snapshot });

    const unsubscribe = auctionEventHub.subscribe(sessionId, (event) => {
      send(event);
    });

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  };
}

export default AuctionController;
