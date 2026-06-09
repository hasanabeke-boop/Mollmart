import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { storePublicImage } from '../../media/services/publicMediaStorage';
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
    const result = await this.catalogService.listPublished(
      req.query as unknown as CatalogListQuery,
      req.user
    );
    res.status(httpStatus.OK).json(result);
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const product = await this.catalogService.getPublishedBySlug(req.params.slug);
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

  remove = async (req: Request, res: Response): Promise<void> => {
    const result = await this.catalogService.remove(req.user!, req.params.id);
    res.status(httpStatus.OK).json(result);
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (file == null) {
      throw badRequest('No file uploaded');
    }
    if (file.buffer == null || !Buffer.isBuffer(file.buffer)) {
      throw badRequest('Invalid upload');
    }
    const folder = req.user?.role === 'buyer' ? 'buyer-requests' : 'catalog';
    const stored = await storePublicImage([folder], file);
    res.status(httpStatus.CREATED).json({ url: stored.url, key: stored.key });
  };
}

export default CatalogController;
