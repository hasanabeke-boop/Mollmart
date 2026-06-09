import { Request, Response } from 'express';
import httpStatus from 'http-status';
import type { AuthUser } from '../../request/types/express';
import DealService from '../services/deal.service';

export class DealController {
  constructor(private readonly dealService: DealService) {}

  getDealState = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.getDealState(req.user as AuthUser, req.params.conversationId);
    res.status(httpStatus.OK).json(data);
  };

  createProposal = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.createPriceProposal(req.user as AuthUser, req.params.conversationId, {
      amount: Number(req.body.amount),
      currency: String(req.body.currency)
    });
    res.status(httpStatus.CREATED).json(data);
  };

  applyOfferTotal = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.applyInitialOfferTotal(
      req.user as AuthUser,
      req.params.conversationId
    );
    res.status(httpStatus.CREATED).json(data);
  };

  acceptProposal = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.acceptPriceProposal(req.user as AuthUser, req.params.proposalId);
    res.status(httpStatus.OK).json(data);
  };

  demoPay = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as { cardLast4: string; cardHolderName?: string };
    const data = await this.dealService.demoPay(
      req.user as AuthUser,
      req.params.conversationId,
      body.cardLast4,
      body.cardHolderName
    );
    res.status(httpStatus.CREATED).json(data);
  };

  listMyOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: string;
    };
    const data = await this.dealService.listMyRequestOrders(req.user as AuthUser, page, limit, status);
    res.status(httpStatus.OK).json(data);
  };

  getMyOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.getMyRequestOrder(req.user as AuthUser, req.params.id);
    res.status(httpStatus.OK).json(data);
  };

  patchMyOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      status: 'in_progress' | 'awaiting_confirmation' | 'completed';
      trackingNumber?: string | null;
      carrier?: string | null;
    };
    const data = await this.dealService.patchMyRequestOrderStatus(req.user as AuthUser, req.params.id, body);
    res.status(httpStatus.OK).json(data);
  };

  getWallet = async (req: Request, res: Response): Promise<void> => {
    const data = await this.dealService.getWallet(req.user as AuthUser);
    res.status(httpStatus.OK).json(data);
  };

  demoWithdraw = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as { amount: number; cardLast4: string; cardHolderName: string };
    const data = await this.dealService.demoWithdraw(
      req.user as AuthUser,
      Number(body.amount),
      String(body.cardLast4 ?? ''),
      String(body.cardHolderName ?? '')
    );
    res.status(httpStatus.OK).json(data);
  };
}

export default DealController;
