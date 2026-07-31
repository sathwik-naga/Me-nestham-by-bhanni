import { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import express from 'express';
import logger from '../utils/logger';

/**
 * Helper to check if an origin is allowed by explicit configuration or domain matching rules
 */
export function isOriginAllowed(origin: string): boolean {
  // Allow non-browser requests (Postman, curl, server-to-server) without Origin header
  if (!origin) return true;

  const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
  const configuredOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://www.menesthambybhanni.com',
    'https://menesthambybhanni.com',
  ];

  const allowedSet = new Set([...configuredOrigins, ...defaultOrigins]);

  // Check wildcard permission in non-production
  if (allowedSet.has('*')) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('SECURITY ALERT: Wildcard CORS origin "*" disallowed in production!');
      return false;
    }
    return true;
  }

  // Exact match check
  if (allowedSet.has(origin)) {
    return true;
  }

  // Pattern matching for Vercel preview/production deployments and custom subdomains
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;

    // Allow all Vercel deployments (*.vercel.app)
    if (hostname.endsWith('.vercel.app') || hostname === 'vercel.app') {
      return true;
    }

    // Allow all subdomains of menesthambybhanni.com
    if (hostname.endsWith('.menesthambybhanni.com')) {
      return true;
    }

    // Allow localhost/127.0.0.1 with any port in non-production
    if (process.env.NODE_ENV !== 'production' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch (err) {
    return false;
  }

  return false;
}

/**
 * Production-ready CORS middleware configuration
 */
export const corsSecurityMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin || '')) {
      return callback(null, true);
    }

    logger.warn(`SECURITY: Blocked CORS request from unauthorized origin: ${origin}`);
    // Return null, false to allow cors middleware to reject origin cleanly without throwing unhandled Express error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Idempotency-Key'],
  optionsSuccessStatus: 204,
});

/**
 * Helmet Security Headers with HSTS, Referrer-Policy, and X-Content-Type-Options
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
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
    const contentType = (res.getHeader('Content-Type') as string) || '';
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
  // 1. Trust Reverse Proxy (Cloudflare / Nginx / Vercel / Railway / Render)
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
