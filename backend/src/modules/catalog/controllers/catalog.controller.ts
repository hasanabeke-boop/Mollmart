import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config/config';
import { badRequest } from '../../request/utils/apiError';
import CatalogService from '../services/catalog.service';
import type { CatalogListQuery } from '../types/catalog';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  listCategories = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.catalogService.listCategories();
    res.status(httpStatus.OK).json(categories);
  };

  listRecommended = async (req: Request, res: Response): Promise<void> => {
    const result = await this.catalogService.listRecommendedForUser(req.user!, req.query as unknown as CatalogListQuery);
    res.status(httpStatus.OK).json(result);
  };

  listPublished = async (req: Request, res: Response): Promise<void> => {
    const result = await this.catalogService.listPublished(req.query as unknown as CatalogListQuery);
    res.status(httpStatus.OK).json(result);
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const { currency } = req.query as { currency?: string };
    const product = await this.catalogService.getPublishedBySlug(req.params.slug, currency);
    res.status(httpStatus.OK).json(product);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await this.catalogService.listMine(req.user!, page, limit);
    res.status(httpStatus.OK).json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const product = await this.catalogService.create(req.user!, req.body);
    res.status(httpStatus.CREATED).json(product);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const product = await this.catalogService.update(req.user!, req.params.id, req.body);
    res.status(httpStatus.OK).json(product);
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (file == null) {
      throw badRequest('No file uploaded');
    }
    const base = config.server.url.replace(/\/$/, '');
    const url = `${base}/uploads/catalog/${file.filename}`;
    res.status(httpStatus.CREATED).json({ url });
  };
}

export default CatalogController;
