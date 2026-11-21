import { Router } from 'express';
import { CampusController } from '../../controllers/campus.controller.js';
import { validateRequest } from '../../middleware/validator.js';
import { CreateTicketSchema, SpeakFreelySchema } from '@solvesphere/shared';

export const campusRouter = Router();

campusRouter.get('/tickets', CampusController.getTickets);
campusRouter.post('/tickets', validateRequest(CreateTicketSchema), CampusController.createTicket);
campusRouter.get('/clusters', CampusController.getClusters);
campusRouter.get('/clubs', CampusController.getClubs);
campusRouter.post('/speak-freely', validateRequest(SpeakFreelySchema), CampusController.submitSpeakFreely);
