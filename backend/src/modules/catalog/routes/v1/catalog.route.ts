import { Router } from 'express';
import { authenticate, requireRoles } from '../../../request/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import { catalogUploadSingle } from '../../middleware/catalogImageUpload';
import CatalogController from '../../controllers/catalog.controller';
import {
  catalogCreateSchema,
  catalogIdParamSchema,
  catalogListQuerySchema,
  catalogMineQuerySchema,
  catalogSlugParamsSchema,
  catalogUpdateSchema
} from '../../validators/catalog.validation';

export function createCatalogRouter(controller: CatalogController): Router {
  const router = Router();

  router.get('/categories', asyncHandler(controller.listCategories));
  router.post(
    '/upload',
    authenticate,
    requireRoles('seller', 'admin'),
    catalogUploadSingle,
    asyncHandler(controller.uploadImage)
  );
  router.get('/products/recommended', authenticate, validate(catalogListQuerySchema), asyncHandler(controller.listRecommended));
  router.get('/products', validate(catalogListQuerySchema), asyncHandler(controller.listPublished));
  router.get(
    '/products/slug/:slug',
    validate(catalogSlugParamsSchema),
    asyncHandler(controller.getBySlug)
  );
  router.get(
    '/products/mine',
    authenticate,
    requireRoles('seller', 'admin'),
    validate(catalogMineQuerySchema),
    asyncHandler(controller.listMine)
  );
  router.post(
    '/products',
    authenticate,
    requireRoles('seller', 'admin'),
    validate(catalogCreateSchema),
    asyncHandler(controller.create)
  );
  router.patch(
    '/products/:id',
    authenticate,
    requireRoles('seller', 'admin'),
    validate(catalogUpdateSchema),
    asyncHandler(controller.update)
  );
  router.delete(
    '/products/:id',
    authenticate,
    requireRoles('seller', 'admin'),
    validate(catalogIdParamSchema),
    asyncHandler(controller.remove)
  );

  return router;
}

export default createCatalogRouter;
