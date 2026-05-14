import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { storePublicImage } from '../../media/services/publicMediaStorage';
import { badRequest } from '../utils/apiError';
import ProfileService from '../services/profile.service';
import { SellerListQuery } from '../types/profile';

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

  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (file == null) {
      throw badRequest('No file uploaded');
    }
    if (file.buffer == null || !Buffer.isBuffer(file.buffer)) {
      throw badRequest('Invalid upload');
    }

    const stored = await storePublicImage(['avatars', req.user!.id], file);
    const profile = await this.profileService.updateMyProfile(req.user!, { avatarUrl: stored.url });
    res.status(httpStatus.CREATED).json({ url: stored.url, key: stored.key, profile });
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
    const profile = await this.profileService.getPublicSellerProfile(req.params.userId);
    res.status(httpStatus.OK).json(profile);
  };

  getBuyerByUserId = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.getBuyerProfile(req.params.userId);
    res.status(httpStatus.OK).json(profile);
  };

  listSellers = async (req: Request, res: Response): Promise<void> => {
    const result = await this.profileService.listPublicSellerProfiles(req.query as unknown as SellerListQuery);
    res.status(httpStatus.OK).json(result);
  };
}

export default ProfileController;
