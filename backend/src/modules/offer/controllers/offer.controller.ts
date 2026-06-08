import { Request, Response } from 'express';
import httpStatus from 'http-status';
import OfferService from '../services/offer.service';
import { OfferListQuery, OfferRequestListQuery } from '../types/offer';

export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const offer = await this.offerService.createOffer(req.user!, req.body);
    res.status(httpStatus.CREATED).json(offer);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const offer = await this.offerService.updateOffer(req.user!, req.params.id, req.body);
    res.status(httpStatus.OK).json(offer);
  };

  withdraw = async (req: Request, res: Response): Promise<void> => {
    const offer = await this.offerService.withdrawOffer(req.user!, req.params.id);
    res.status(httpStatus.OK).json(offer);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const result = await this.offerService.listOwnOffers(req.user!, req.query as unknown as OfferListQuery);
    res.status(httpStatus.OK).json(result);
  };

  getByRequest = async (req: Request, res: Response): Promise<void> => {
    const query = {
      ...(req.query as object),
      requestId: req.params.requestId
    } as OfferRequestListQuery;

    const result = await this.offerService.listOffersForRequest(req.user!, query);
    res.status(httpStatus.OK).json(result);
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const offer = await this.offerService.acceptOffer(req.user!, req.params.id);
    res.status(httpStatus.OK).json(offer);
  };
}

export default OfferController;
