import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import express from 'express';
import logger from '../utils/logger';

/**
 * Parses ALLOWED_ORIGINS and CORS_ORIGIN environment variables into an array of allowed origins
 */
export function getCorsOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
  return envOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Environment-aware CORS middleware configuration
 */
export const corsSecurityMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) without Origin header
    if (!origin) return callback(null, true);

    const allowed = getCorsOrigins();
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd && allowed.includes('*')) {
      logger.error('SECURITY ALERT: Wildcard CORS origin "*" disallowed in production!');
      return callback(new Error('Wildcard origins prohibited in production'), false);
    }

    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`SECURITY: Blocked CORS request from unauthorized origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS security policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Idempotency-Key'],
});

/**
 * Helmet Security Headers with HSTS, Referrer-Policy, and X-Content-Type-Options
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: false, // CSP can be customized when strict domain requirements arise
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  noSniff: true,
});

/**
 * Filtered compression skipping pre-compressed binary images, PDFs, and ZIP archives
 */
export const compressionSecurityMiddleware = compression({
  filter: (req: Request, res: Response) => {
    const contentType = res.getHeader('Content-Type') as string || '';
    if (contentType.includes('image/') || contentType.includes('application/pdf') || contentType.includes('zip')) {
      return false;
    }
    return compression.filter(req, res);
  },
});

/**
 * HTTP Parameter Pollution (HPP) Middleware
 */
export const hppMiddleware = hpp();

/**
 * JSON Request Body Parser capped at 1 MB with raw body capture for webhook verification
 */
export const jsonBodyLimitMiddleware = express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
});

/**
 * Central security middleware registry function
 */
export function registerSecurityMiddleware(app: express.Express) {
  // 1. Trust Reverse Proxy (Cloudflare / Nginx / Vercel / Railway)
  app.set('trust proxy', 1);

  // 2. Disable X-Powered-By header
  app.disable('x-powered-by');

  // 3. Security headers & CORS
  app.use(helmetSecurityMiddleware);
  app.use(corsSecurityMiddleware);

  // 4. Response Compression
  app.use(compressionSecurityMiddleware);

  // 5. Parameter Pollution Protection
  app.use(hppMiddleware);

  // 6. Request Body Limit (1 MB)
  app.use(jsonBodyLimitMiddleware);
}
