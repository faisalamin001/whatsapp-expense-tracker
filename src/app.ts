import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { requestId } from './middleware/request-id.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { sanitizeBody } from './middleware/sanitize.middleware';
import { generalLimiter, webhookLimiter } from './middleware/rate-limit.middleware';
import { webhookRouter } from './modules/webhook/webhook.router';

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1); // Required for rate limiter to read real IP behind a proxy

// ── Request ID ──────────────────────────────────────────────────────────────
app.use(requestId);

// ── Body parsing (raw body captured before JSON parse for HMAC verification) ─
app.use(
  express.json({
    limit: '100kb',
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Input sanitization ───────────────────────────────────────────────────────
app.use(sanitizeBody);

// ── Request logging ──────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/webhook', webhookLimiter, webhookRouter);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) =>
  errorMiddleware(err, req, res, next)
);

export { app };
