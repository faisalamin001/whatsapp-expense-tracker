import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function errorMiddleware(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn('Operational error', { message: err.message, statusCode: err.statusCode });
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn('Validation error', { errors: err.flatten() });
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }

  // Express body-parser errors (payload too large, invalid JSON, etc.)
  const httpStatus = err.status ?? err.statusCode;
  if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
    logger.warn('HTTP client error', { message: err.message, status: httpStatus });
    res.status(httpStatus).json({ error: err.message });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}
