import { Router } from 'express';
import AdminController from '../../controllers/admin.controller';
import AdminRepository from '../../repositories/admin.repository';
import AdminEventPublisher from '../../services/admin-event.service';
import AdminService from '../../services/admin.service';
import { createAdminRouter } from './admin.route';

const router = Router();

const adminRepository = new AdminRepository();
const adminEventPublisher = new AdminEventPublisher();
const adminService = new AdminService(adminRepository, adminEventPublisher);
const adminController = new AdminController(adminService);

router.use('/', createAdminRouter(adminController));

export default router;
