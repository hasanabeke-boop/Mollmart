import { Request, Response } from 'express';
import httpStatus from 'http-status';
import type { AuthUser } from '../../request/types/express';
import ShopService from '../services/shop.service';
import type { AddCartItemInput, CheckoutInput } from '../services/shop.service';

export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  getCart = async (req: Request, res: Response): Promise<void> => {
    const data = await this.shopService.getCart(req.user as AuthUser);
    res.status(httpStatus.OK).json(data);
  };

  addCartItem = async (req: Request, res: Response): Promise<void> => {
    const row = await this.shopService.addToCart(req.user as AuthUser, req.body as AddCartItemInput);
    res.status(httpStatus.OK).json(row);
  };

  patchCartItem = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    const { quantity } = req.body as { quantity: number };
    const data = await this.shopService.setCartQuantity(req.user as AuthUser, productId, quantity);
    res.status(httpStatus.OK).json(data);
  };

  deleteCartItem = async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    await this.shopService.removeFromCart(req.user as AuthUser, productId);
    res.status(httpStatus.NO_CONTENT).send();
  };

  checkout = async (req: Request, res: Response): Promise<void> => {
    const data = await this.shopService.checkout(req.user as AuthUser, req.body as CheckoutInput);
    res.status(httpStatus.CREATED).json(data);
  };

  listOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: string;
    };
    const data = await this.shopService.listMyOrders(req.user as AuthUser, page, limit, status);
    res.status(httpStatus.OK).json(data);
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await this.shopService.getMyOrder(req.user as AuthUser, req.params.id);
    res.status(httpStatus.OK).json(data);
  };
}

export default ShopController;
