import { Router } from 'express';
import CatalogController from '../../controllers/catalog.controller';
import CatalogRepository from '../../repositories/catalog.repository';
import CatalogService from '../../services/catalog.service';
import { createCatalogRouter } from './catalog.route';

const catalogRepository = new CatalogRepository();
const catalogService = new CatalogService(catalogRepository);
const catalogController = new CatalogController(catalogService);

const router = Router();
router.use('/', createCatalogRouter(catalogController));

export default router;
