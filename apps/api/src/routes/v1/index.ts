import { Router } from 'express';
import { healthRouter } from '../health.routes.js';
import { academicRouter } from './academic.routes.js';
import { campusRouter } from './campus.routes.js';
import { adminRouter } from './admin.routes.js';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/academic', academicRouter);
v1Router.use('/campus', campusRouter);
v1Router.use('/admin', adminRouter);
