import { Router } from 'express';
import ProfileController from '../../controllers/profile.controller';
import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import asyncHandler from '../../utils/asyncHandler';
import {
  profileIdParamSchema,
  sellerListQuerySchema,
  updateBaseProfileSchema,
  updateBuyerProfileSchema,
  updateSellerProfileSchema
} from '../../validators/profile.validation';

export function createProfileRouter(controller: ProfileController): Router {
  const router = Router();

  router.get('/profiles/sellers', validate(sellerListQuerySchema), asyncHandler(controller.listSellers));
  router.get('/profiles/sellers/:userId', validate(profileIdParamSchema), asyncHandler(controller.getSellerByUserId));
  router.get('/profiles/buyers/:userId', validate(profileIdParamSchema), asyncHandler(controller.getBuyerByUserId));

  router.use(authenticate);

  router.get('/profiles/me', asyncHandler(controller.getMe));
  router.patch('/profiles/me', validate(updateBaseProfileSchema), asyncHandler(controller.updateMe));
  router.patch('/profiles/me/seller', validate(updateSellerProfileSchema), asyncHandler(controller.updateSeller));
  router.patch('/profiles/me/buyer', validate(updateBuyerProfileSchema), asyncHandler(controller.updateBuyer));

  return router;
}

export default createProfileRouter;
