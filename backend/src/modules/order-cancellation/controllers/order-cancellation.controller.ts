import { OrderCancellationStatus } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import OrderCancellationService from '../services/order-cancellation.service';

export class OrderCancellationController {
  constructor(private readonly service: OrderCancellationService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.create(req.user!, req.body.orderId, req.body.reason);
    res.status(httpStatus.CREATED).json(data);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const data = await this.service.listMine(req.user!, page, limit);
    res.json(data);
  };

  getForOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getForOrder(req.user!, req.params.orderId);
    if (data == null) {
      res.status(httpStatus.NO_CONTENT).send();
      return;
    }
    res.json(data);
  };

  listAdmin = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: OrderCancellationStatus;
    };
    const data = await this.service.listAdmin(page, limit, status);
    res.json(data);
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.approve(req.user!, req.params.id, req.body.adminNote);
    res.json(data);
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.reject(req.user!, req.params.id, req.body.adminNote);
    res.json(data);
  };
}

export default OrderCancellationController;
