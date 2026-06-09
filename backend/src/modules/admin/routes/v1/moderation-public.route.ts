import { Router } from 'express';
import AdminController from '../../controllers/admin.controller';
import { authenticate } from '../../../request/middleware/auth';
import validate from '../../../request/middleware/validate';
import asyncHandler from '../../../request/utils/asyncHandler';
import { contentReportSchema } from '../../validators/admin.validation';

export function createModerationPublicRouter(controller: AdminController): Router {
  const router = Router();

  router.post(
    '/moderation/reports',
    authenticate,
    validate(contentReportSchema),
    asyncHandler(controller.submitContentReport)
  );

  return router;
}

export default createModerationPublicRouter;
