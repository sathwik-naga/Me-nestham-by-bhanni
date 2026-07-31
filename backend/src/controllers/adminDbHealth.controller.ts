import { Request, Response, NextFunction } from 'express';
import { DbHealthService } from '../services/dbHealth.service';

const dbHealthService = new DbHealthService();

export class AdminDbHealthController {
  /**
   * GET /api/admin/database/health
   * Operations & database health audit dashboard endpoint (Admin only)
   */
  async getDatabaseHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await dbHealthService.runHealthAudit();

      const statusCode = report.status === 'CRITICAL' ? 503 : 200;
      res.status(statusCode).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
