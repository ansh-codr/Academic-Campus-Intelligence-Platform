import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.get('/overview', AdminController.getOverview);
adminRouter.get('/workload', AdminController.getWorkload);
adminRouter.get('/clusters', AdminController.getClusters);
adminRouter.get('/academic', AdminController.getAcademicOverview);
