import { Router } from 'express';
import ProfileController from '../../controllers/profile.controller';
import ProfileRepository from '../../repositories/profile.repository';
import ProfileEventPublisher from '../../services/profile-event.service';
import ProfileService from '../../services/profile.service';
import { createProfileRouter } from './profile.route';

const router = Router();

const profileRepository = new ProfileRepository();
const profileEventPublisher = new ProfileEventPublisher();
const profileService = new ProfileService(profileRepository, profileEventPublisher);
const profileController = new ProfileController(profileService);

router.use('/', createProfileRouter(profileController));

export default router;
