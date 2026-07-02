import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from './error.middleware';

export function verifyWebhookSignature(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature || typeof signature !== 'string') {
    logger.warn('Webhook signature missing', { ip: req.ip });
    return next(new AppError(401, 'Missing webhook signature'));
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody) {
    return next(new AppError(400, 'Raw body not available for signature verification'));
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', env.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest('hex')}`;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!isValid) {
    logger.warn('Webhook signature invalid', { ip: req.ip });
    return next(new AppError(401, 'Invalid webhook signature'));
  }

  next();
}
