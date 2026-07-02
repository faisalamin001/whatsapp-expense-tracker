import { Request, Response, NextFunction } from 'express';

const MAX_MESSAGE_LENGTH = 1000;

// Strip null bytes and control characters that could cause issues in DB or AI prompts
function sanitizeString(value: string): string {
  return value
    .replace(/\0/g, '')                  // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t \n \r)
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitizeObject(v)])
    );
  }
  return obj;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}
