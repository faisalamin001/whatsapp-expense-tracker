import rateLimit from 'express-rate-limit';

// General limiter for all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for the webhook endpoint
// Meta sends at most a few messages per second per number — 300/min is very generous
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded.' },
  // Skip rate limiting for Meta's IPs in production (optional enhancement)
  skip: () => false,
});
