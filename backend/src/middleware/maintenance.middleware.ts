import { Request, Response, NextFunction } from 'express';
import { systemConfig } from '../services/systemConfig.service';

/**
 * Maintenance Mode & System Flag Middleware
 * If maintenance mode is active, non-admin customer requests are blocked with HTTP 503
 */
export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const flags = systemConfig.getFlags();

  // Allow admin routes, login/auth callback, and system health checks during maintenance
  const isExcludedPath = 
    req.path.startsWith('/admin') ||
    req.path.startsWith('/api/admin') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/api/health') ||
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/callback');

  if (flags.isMaintenanceMode && !isExcludedPath) {
    res.status(503).json({
      success: false,
      maintenance: true,
      message: 'System is currently undergoing scheduled maintenance. Please check back shortly.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}
