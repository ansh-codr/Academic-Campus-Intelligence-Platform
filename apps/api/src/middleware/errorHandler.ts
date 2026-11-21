import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error('[API Error]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
