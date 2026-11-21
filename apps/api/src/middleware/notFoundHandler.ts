import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      suggestedRoutes: [
        '/api/health',
        '/api/v1/academic/subjects',
        '/api/v1/campus/tickets',
        '/api/v1/admin/overview',
      ],
    },
  });
}
