import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import { AppError } from '../middleware/error';

const emailRepository = new EmailRepository();
const resendProvider = new ResendProvider();
const emailService = new EmailService(emailRepository, resendProvider);

export class EmailController {
  /**
   * GET /api/emails/logs
   * Retrieve outgoing email logs list (Admin only)
   */
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 50);
      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const template = req.query.template ? String(req.query.template) : undefined;

      const result = await emailRepository.getPaginated({
        page,
        limit,
        search,
        status,
        template,
      });

      res.status(200).json({
        status: 'success',
        data: {
          logs: result.logs,
          total: result.total,
          page,
          limit,
          totalPages: result.totalPages || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/emails/retry/:id
   * Manually retry delivery of a failed email log entry (Admin only)
   */
  async retryEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Log entry ID is required', 400);
      }

      await emailService.retryLoggedEmail(id);

      res.status(200).json({
        status: 'success',
        message: 'Email retry job successfully scheduled',
      });
    } catch (error: any) {
      next(new AppError(error?.message || 'Failed to retry email delivery', 400));
    }
  }

  /**
   * GET /api/emails/metrics
   * Retrieve aggregate delivery metrics (Admin only)
   */
  async getMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await emailRepository.getDeliveryMetrics();
      res.status(200).json({
        status: 'success',
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default EmailController;
