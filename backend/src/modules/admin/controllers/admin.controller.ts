import { CatalogOrderStatus } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AdminService from '../services/admin.service';
import ShopService from '../../shop/services/shop.service';
import DealService from '../../deal/services/deal.service';
import { getDatabaseStats } from '../../../lib/databaseOps';
import { ModerationCaseListQuery } from '../types/admin';

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly shopService: ShopService,
    private readonly dealService: DealService
  ) {}

  createCategory = async (req: Request, res: Response): Promise<void> => {
    const category = await this.adminService.createCategory(req.user!, req.body);
    res.status(httpStatus.CREATED).json(category);
  };

  listCategories = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.adminService.listCategories();
    res.status(httpStatus.OK).json(categories);
  };

  updateCategory = async (req: Request, res: Response): Promise<void> => {
    const category = await this.adminService.updateCategory(req.user!, req.params.id, req.body);
    res.status(httpStatus.OK).json(category);
  };

  createModerationCase = async (req: Request, res: Response): Promise<void> => {
    const moderationCase = await this.adminService.createModerationCase(req.user!, req.body);
    res.status(httpStatus.CREATED).json(moderationCase);
  };

  submitContentReport = async (req: Request, res: Response): Promise<void> => {
    const result = await this.adminService.submitContentReport(req.user!, req.body);
    res.status(httpStatus.CREATED).json(result);
  };

  listModerationCases = async (req: Request, res: Response): Promise<void> => {
    const cases = await this.adminService.listModerationCases(req.query as unknown as ModerationCaseListQuery);
    res.status(httpStatus.OK).json(cases);
  };

  updateModerationCase = async (req: Request, res: Response): Promise<void> => {
    const moderationCase = await this.adminService.updateModerationCase(req.user!, req.params.id, req.body);
    res.status(httpStatus.OK).json(moderationCase);
  };

  blockUser = async (req: Request, res: Response): Promise<void> => {
    const blockedUser = await this.adminService.blockUser(req.user!, req.params.userId, req.body);
    res.status(httpStatus.OK).json(blockedUser);
  };

  unblockUser = async (req: Request, res: Response): Promise<void> => {
    const blockedUser = await this.adminService.unblockUser(req.params.userId);
    res.status(httpStatus.OK).json(blockedUser);
  };

  getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.adminService.getDashboardSummary();
    res.status(httpStatus.OK).json(summary);
  };

  getPlatformReport = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.adminService.getPlatformReport();
    res.status(httpStatus.OK).json(report);
  };

  getDatabaseStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await getDatabaseStats();
    res.status(httpStatus.OK).json(stats);
  };

  listCatalogOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: string;
    };
    const data = await this.shopService.listOrdersAdmin(page, limit, status);
    res.status(httpStatus.OK).json(data);
  };

  patchCatalogOrder = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      status?: CatalogOrderStatus;
      trackingNumber?: string | null;
      carrier?: string | null;
    };
    const data = await this.shopService.patchOrderAdmin(req.user!, req.params.id, {
      status: body.status,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier
    });
    res.status(httpStatus.OK).json(data);
  };

  listRequestOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: string;
    };
    const data = await this.dealService.listRequestOrdersAdmin(page, limit, status);
    res.status(httpStatus.OK).json(data);
  };

  patchRequestOrder = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      status?: CatalogOrderStatus;
      trackingNumber?: string | null;
      carrier?: string | null;
    };
    const data = await this.dealService.patchRequestOrderAdmin(req.params.id, {
      status: body.status,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier
    });
    res.status(httpStatus.OK).json(data);
  };

  deleteRequestOrder = async (req: Request, res: Response): Promise<void> => {
    await this.dealService.deleteRequestOrderAdmin(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  };

  deleteCatalogOrder = async (req: Request, res: Response): Promise<void> => {
    await this.shopService.deleteOrderAdmin(req.user!, req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  };

  listRequests = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, q } = req.query as unknown as {
      page: number;
      limit: number;
      q?: string;
    };
    const data = await this.adminService.listRequests(page, limit, q);
    res.status(httpStatus.OK).json(data);
  };

  deleteRequest = async (req: Request, res: Response): Promise<void> => {
    await this.adminService.deleteRequest(req.user!, req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  };

  hideContent = async (req: Request, res: Response): Promise<void> => {
    const result = await this.adminService.hideContent(req.user!, req.body);
    res.status(httpStatus.OK).json(result);
  };

  unhideContent = async (req: Request, res: Response): Promise<void> => {
    const result = await this.adminService.unhideContent(req.user!, req.body);
    res.status(httpStatus.OK).json(result);
  };

  deleteContent = async (req: Request, res: Response): Promise<void> => {
    await this.adminService.deleteContent(req.user!, {
      targetType: req.params.targetType as never,
      targetId: req.params.targetId
    });
    res.status(httpStatus.NO_CONTENT).send();
  };

  listCatalogProducts = async (req: Request, res: Response): Promise<void> => {
    const data = await this.adminService.listCatalogProductsAdmin(req.query as never);
    res.status(httpStatus.OK).json(data);
  };

  listOffers = async (req: Request, res: Response): Promise<void> => {
    const data = await this.adminService.listOffersAdmin(req.query as never);
    res.status(httpStatus.OK).json(data);
  };

  listAuctions = async (req: Request, res: Response): Promise<void> => {
    const data = await this.adminService.listAuctionsAdmin(req.query as never);
    res.status(httpStatus.OK).json(data);
  };

  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    await this.adminService.deleteCategory(req.user!, req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  };
}

export default AdminController;
