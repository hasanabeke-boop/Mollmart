import { Router } from 'express';
import AdminController from '../../controllers/admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
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

  router.use(authenticate);
  router.use(requireAdmin);

  router.post('/admin/categories', validate(categoryCreateSchema), asyncHandler(controller.createCategory));
  router.get('/admin/categories', asyncHandler(controller.listCategories));
  router.patch('/admin/categories/:id', validate(categoryUpdateSchema), asyncHandler(controller.updateCategory));

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

  return router;
}

export default createAdminRouter;
