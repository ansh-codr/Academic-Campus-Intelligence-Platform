import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0-phase1',
    environment: process.env.NODE_ENV || 'development',
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryMb: {
        rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
    database: {
      configured: dbStatus.isConfigured,
      status: dbStatus.status,
      note: dbStatus.isConfigured
        ? 'Database URL is configured in environment.'
        : 'Database URL not provided. Running in Phase 1 standalone API foundation mode.',
      error: dbStatus.lastError || undefined,
    },
    modules: {
      academicIntelligence: 'Active (Foundation)',
      campusIntelligence: 'Active (Foundation)',
      aiServiceLayer: 'Prepared for Phase 2 integration',
      authentication: 'Phase 1 Preview Mode',
    },
  });
});
