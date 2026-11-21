import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { v1Router } from './v1/index.js';

export const mainRouter = Router();

// Root level health check at /api/health
mainRouter.use('/health', healthRouter);

// Versioned API routes at /api/v1
mainRouter.use('/v1', v1Router);
