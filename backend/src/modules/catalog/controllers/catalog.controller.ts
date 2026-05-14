import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config/config';
import { badRequest } from '../../request/utils/apiError';
import CatalogService from '../services/catalog.service';
import { publicUrlForCatalogKey, putCatalogImageObject } from '../services/r2CatalogStorage';
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
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const filename = `${uuidv4()}${safeExt}`;
    const folder = req.user?.role === 'buyer' ? 'buyer-requests' : 'catalog';

    if (config.r2.enabled) {
      const r2 = config.r2;
      const key = `${folder}/${filename}`;
      await putCatalogImageObject(r2, key, file.buffer, file.mimetype);
      const url = publicUrlForCatalogKey(r2, key);
      res.status(httpStatus.CREATED).json({ url });
      return;
    }

    const uploadRoot = path.join(process.cwd(), 'uploads', folder);
    fs.mkdirSync(uploadRoot, { recursive: true });
    fs.writeFileSync(path.join(uploadRoot, filename), file.buffer);
    const base = config.server.url.replace(/\/$/, '');
    res.status(httpStatus.CREATED).json({ url: `${base}/uploads/${folder}/${filename}` });
  };
}

export default CatalogController;
