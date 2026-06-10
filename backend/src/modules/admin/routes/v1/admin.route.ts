import { Router } from 'express';
import AdminController from '../../controllers/admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
  adminCatalogOrderListSchema,
  adminCatalogOrderPatchSchema
} from '../../../shop/validators/shop.validation';
import {
  adminRequestOrderListSchema,
  adminRequestOrderPatchSchema
} from '../../../deal/validators/deal.validation';
import {
  adminContentActionSchema,
  adminContentTargetParamSchema,
  adminIdParamSchema,
  adminListQuerySchema,
  adminRequestListSchema,
  blockUserSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  moderationCaseCreateSchema,
  moderationCaseListSchema,
  moderationCaseUpdateSchema,
  userIdParamSchema
} from '../../validators/admin.validation';

export function createAdminRouter(controller: AdminController): Router {
  const router = Router();

  router.use('/admin', authenticate);
  router.use('/admin', requireAdmin);

  router.post('/admin/categories', validate(categoryCreateSchema), asyncHandler(controller.createCategory));
  router.get('/admin/categories', asyncHandler(controller.listCategories));
  router.patch('/admin/categories/:id', validate(categoryUpdateSchema), asyncHandler(controller.updateCategory));
  router.delete('/admin/categories/:id', validate(adminIdParamSchema), asyncHandler(controller.deleteCategory));

  router.post('/admin/content/hide', validate(adminContentActionSchema), asyncHandler(controller.hideContent));
  router.post('/admin/content/unhide', validate(adminContentActionSchema), asyncHandler(controller.unhideContent));
  router.delete(
    '/admin/content/:targetType/:targetId',
    validate(adminContentTargetParamSchema),
    asyncHandler(controller.deleteContent)
  );

  router.get(
    '/admin/catalog-products',
    validate(adminListQuerySchema),
    asyncHandler(controller.listCatalogProducts)
  );
  router.get('/admin/offers', validate(adminListQuerySchema), asyncHandler(controller.listOffers));
  router.get('/admin/auctions', validate(adminListQuerySchema), asyncHandler(controller.listAuctions));

  router.post(
    '/admin/moderation/cases',
    validate(moderationCaseCreateSchema),
    asyncHandler(controller.createModerationCase)
  );
  router.get(
    '/admin/moderation/cases',
    validate(moderationCaseListSchema),
    asyncHandler(controller.listModerationCases)
  );
  router.patch(
    '/admin/moderation/cases/:id',
    validate(moderationCaseUpdateSchema),
    asyncHandler(controller.updateModerationCase)
  );

  router.post('/admin/users/:userId/block', validate(blockUserSchema), asyncHandler(controller.blockUser));
  router.post('/admin/users/:userId/unblock', validate(userIdParamSchema), asyncHandler(controller.unblockUser));
  router.get('/admin/dashboard/summary', asyncHandler(controller.getDashboardSummary));
  router.get('/admin/reports/overview', asyncHandler(controller.getPlatformReport));
  router.get('/admin/database/stats', asyncHandler(controller.getDatabaseStats));

  router.get(
    '/admin/catalog-orders',
    validate(adminCatalogOrderListSchema),
    asyncHandler(controller.listCatalogOrders)
  );
  router.patch(
    '/admin/catalog-orders/:id',
    validate(adminCatalogOrderPatchSchema),
    asyncHandler(controller.patchCatalogOrder)
  );
  router.delete(
    '/admin/catalog-orders/:id',
    validate(adminIdParamSchema),
    asyncHandler(controller.deleteCatalogOrder)
  );

  router.get(
    '/admin/request-orders',
    validate(adminRequestOrderListSchema),
    asyncHandler(controller.listRequestOrders)
  );
  router.patch(
    '/admin/request-orders/:id',
    validate(adminRequestOrderPatchSchema),
    asyncHandler(controller.patchRequestOrder)
  );
  router.delete(
    '/admin/request-orders/:id',
    validate(adminIdParamSchema),
    asyncHandler(controller.deleteRequestOrder)
  );

  router.get('/admin/requests', validate(adminRequestListSchema), asyncHandler(controller.listRequests));
  router.delete('/admin/requests/:id', validate(adminIdParamSchema), asyncHandler(controller.deleteRequest));

  return router;
}

export default createAdminRouter;
