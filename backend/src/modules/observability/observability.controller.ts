import { Request, Response, NextFunction } from 'express';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { AuditService } from './audit.service';

export class ObservabilityController {
  /**
   * GET / & HEAD / - Root Health Check for Render Deployment
   */
  public getRootHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = {
        success: true,
        service: 'Me Nestham By Bhanni Backend',
        status: 'healthy',
        environment: process.env.NODE_ENV || 'production',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
      };

      if (req.method === 'HEAD') {
        res.status(200).end();
        return;
      }

      res.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/health - Detailed System Overview
   */
  public getSystemOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await HealthService.getSystemOverview();
      res.status(overview.status === 'healthy' ? 200 : 503).json({
        success: overview.status === 'healthy',
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/health/database
   */
  public getDatabaseHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await HealthService.checkDatabase();
      res.status(status.status === 'unhealthy' ? 503 : 200).json({
        success: status.status !== 'unhealthy',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/health/storage
   */
  public getStorageHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await HealthService.checkStorage();
      res.status(status.status === 'unhealthy' ? 503 : 200).json({
        success: status.status !== 'unhealthy',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/health/email
   */
  public getEmailHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await HealthService.checkEmail();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/health/payment
   */
  public getPaymentHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await HealthService.checkPayment();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/observability/dashboard (Admin Only)
   */
  public getAdminDashboardData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [health, securityMetrics, businessMetrics, auditLogs] = await Promise.all([
        HealthService.getSystemOverview(),
        MetricsService.getSecurityMetrics(),
        MetricsService.getBusinessMetrics(),
        AuditService.getRecentAuditLogs(20, 0),
      ]);

      res.status(200).json({
        success: true,
        data: {
          health,
          securityMetrics,
          businessMetrics,
          auditLogs: auditLogs.logs,
          auditTotal: auditLogs.total,
          deployment: {
            frontendVersion: '1.0.0',
            backendVersion: '1.0.0',
            gitCommit: '216e278',
            environment: process.env.NODE_ENV || 'development',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/observability/audit-logs (Admin Only)
   */
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query.limit || 50);
      const offset = Number(req.query.offset || 0);

      const result = await AuditService.getRecentAuditLogs(limit, offset);
      res.status(200).json({
        success: true,
        data: result.logs,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  };
}
