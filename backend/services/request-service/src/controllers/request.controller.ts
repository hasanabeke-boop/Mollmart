import { Request, Response } from 'express';
import httpStatus from 'http-status';
import RequestService from '../services/request.service';
import { OwnerRequestQuery, RequestBoardQuery } from '../types/request';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const request = await this.requestService.createRequest(req.user!, req.body);
    res.status(httpStatus.CREATED).json(request);
  };

  publish = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.id, 'Request id');
    const request = await this.requestService.publishRequest(req.user!, requestId);
    res.status(httpStatus.OK).json(request);
  };

  getMine = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as OwnerRequestQuery;
    const result = await this.requestService.listOwnRequests(req.user!, query);
    res.status(httpStatus.OK).json(result);
  };

  listBoard = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as RequestBoardQuery;
    const result = await this.requestService.listSellerBoard(req.user!, query);
    res.status(httpStatus.OK).json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.id, 'Request id');
    const request = await this.requestService.getRequestById(req.user!, requestId);
    res.status(httpStatus.OK).json(request);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.id, 'Request id');
    const request = await this.requestService.updateRequest(req.user!, requestId, req.body);
    res.status(httpStatus.OK).json(request);
  };

  close = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.id, 'Request id');
    const request = await this.requestService.closeRequest(req.user!, requestId);
    res.status(httpStatus.OK).json(request);
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const requestId = requireParam(req.params.id, 'Request id');
    const request = await this.requestService.cancelRequest(req.user!, requestId);
    res.status(httpStatus.OK).json(request);
  };
}

export default RequestController;
