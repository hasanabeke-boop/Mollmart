import { Router } from 'express';
import RequestRepository from '../../repositories/request.repository';
import RequestService from '../../services/request.service';
import RequestController from '../../controllers/request.controller';
import RequestEventPublisher from '../../services/request-event.service';
import { createRequestRouter } from './request.route';

const router = Router();

const requestRepository = new RequestRepository();
const requestEventPublisher = new RequestEventPublisher();
const requestService = new RequestService(requestRepository, requestEventPublisher);
const requestController = new RequestController(requestService);

router.use('/requests', createRequestRouter(requestController));

export default router;
