import rateLimit from 'express-rate-limit';
import { AppError } from './error';
import logger from '../utils/logger';

/**
 * Helper to log security rate limit breaches
 */
const rateLimitHandler = (message: string) => (req: any, _res: any, next: any) => {
  logger.warn(`SECURITY ALERT: Rate limit exceeded by IP ${req.ip} on ${req.method} ${req.originalUrl}`);
  next(new AppError(message, 429));
};

/**
 * General API Rate Limiter: 200 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exclude /health endpoint and Razorpay webhook from general rate limiting
    if (req.originalUrl.includes('/health') || req.originalUrl.includes('/payments/webhook')) {
      return true;
    }
    return false;
  },
  handler: rateLimitHandler('Too many requests to API. Please try again in 15 minutes.'),
});

/**
 * Login Rate Limiter: 10 requests / 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many failed login attempts. Please try again after 15 minutes.'),
});

/**
 * Register Rate Limiter: 20 requests / hour
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many registration attempts. Please try again in an hour.'),
});

/**
 * Forgot Password Rate Limiter: 5 requests / hour
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many password reset attempts. Please try again in an hour.'),
});

/**
 * Contact Form Rate Limiter: 10 requests / hour
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many contact form submissions. Please try again in an hour.'),
});
