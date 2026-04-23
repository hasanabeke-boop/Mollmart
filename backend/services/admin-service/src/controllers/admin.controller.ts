import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AdminService from '../services/admin.service';
import { ModerationCaseListQuery } from '../types/admin';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  createCategory = async (req: Request, res: Response): Promise<void> => {
    const category = await this.adminService.createCategory(req.user!, req.body);
    res.status(httpStatus.CREATED).json(category);
  };

  listCategories = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.adminService.listCategories();
    res.status(httpStatus.OK).json(categories);
  };

  updateCategory = async (req: Request, res: Response): Promise<void> => {
    const categoryId = requireParam(req.params.id, 'Category id');
    const category = await this.adminService.updateCategory(req.user!, categoryId, req.body);
    res.status(httpStatus.OK).json(category);
  };

  createModerationCase = async (req: Request, res: Response): Promise<void> => {
    const moderationCase = await this.adminService.createModerationCase(req.user!, req.body);
    res.status(httpStatus.CREATED).json(moderationCase);
  };

  listModerationCases = async (req: Request, res: Response): Promise<void> => {
    const cases = await this.adminService.listModerationCases(req.query as unknown as ModerationCaseListQuery);
    res.status(httpStatus.OK).json(cases);
  };

  updateModerationCase = async (req: Request, res: Response): Promise<void> => {
    const moderationCaseId = requireParam(req.params.id, 'Moderation case id');
    const moderationCase = await this.adminService.updateModerationCase(req.user!, moderationCaseId, req.body);
    res.status(httpStatus.OK).json(moderationCase);
  };

  blockUser = async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'User id');
    const blockedUser = await this.adminService.blockUser(req.user!, userId, req.body);
    res.status(httpStatus.OK).json(blockedUser);
  };

  unblockUser = async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'User id');
    const blockedUser = await this.adminService.unblockUser(userId);
    res.status(httpStatus.OK).json(blockedUser);
  };

  getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.adminService.getDashboardSummary();
    res.status(httpStatus.OK).json(summary);
  };
}

export default AdminController;
