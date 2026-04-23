import { Request, Response } from 'express';
import httpStatus from 'http-status';
import OfferService from '../services/offer.service';
import { OfferListQuery, OfferRequestListQuery } from '../types/offer';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const offer = await this.offerService.createOffer(req.user!, req.body);
    res.status(httpStatus.CREATED).json(offer);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const offerId = requireParam(req.params.id, 'Offer id');
    const offer = await this.offerService.updateOffer(req.user!, offerId, req.body);
    res.status(httpStatus.OK).json(offer);
  };

  withdraw = async (req: Request, res: Response): Promise<void> => {
    const offerId = requireParam(req.params.id, 'Offer id');
    const offer = await this.offerService.withdrawOffer(req.user!, offerId);
    res.status(httpStatus.OK).json(offer);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const result = await this.offerService.listOwnOffers(req.user!, req.query as unknown as OfferListQuery);
    res.status(httpStatus.OK).json(result);
  };

  getByRequest = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.requestId, 'Request id');
    const query = {
      ...(req.query as object),
      requestId
    } as OfferRequestListQuery;

    const result = await this.offerService.listOffersForRequest(req.user!, query);
    res.status(httpStatus.OK).json(result);
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const offerId = requireParam(req.params.id, 'Offer id');
    const offer = await this.offerService.acceptOffer(req.user!, offerId);
    res.status(httpStatus.OK).json(offer);
  };
}

export default OfferController;
