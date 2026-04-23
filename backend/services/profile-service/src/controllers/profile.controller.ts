import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ProfileService from '../services/profile.service';
import { SellerListQuery } from '../types/profile';
import { badRequest } from '../utils/apiError';

function requireParam(value: string | undefined, name: string): string {
  if (value == null) {
    throw badRequest(`${name} is required`);
  }

  return value;
}

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.getMyProfile(req.user!);
    res.status(httpStatus.OK).json(profile);
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.updateMyProfile(req.user!, req.body);
    res.status(httpStatus.OK).json(profile);
  };

  updateSeller = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.updateMySellerProfile(req.user!, req.body);
    res.status(httpStatus.OK).json(profile);
  };

  updateBuyer = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.updateMyBuyerProfile(req.user!, req.body);
    res.status(httpStatus.OK).json(profile);
  };

  getSellerByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'User id');
    const profile = await this.profileService.getPublicSellerProfile(userId);
    res.status(httpStatus.OK).json(profile);
  };

  getBuyerByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'User id');
    const profile = await this.profileService.getBuyerProfile(userId);
    res.status(httpStatus.OK).json(profile);
  };

  listSellers = async (req: Request, res: Response): Promise<void> => {
    const result = await this.profileService.listPublicSellerProfiles(req.query as unknown as SellerListQuery);
    res.status(httpStatus.OK).json(result);
  };
}

export default ProfileController;
