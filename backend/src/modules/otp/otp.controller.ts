import { Request, Response, NextFunction } from 'express';
import { OTPService } from './otp.service';

export class OTPController {
  constructor(private otpService: OTPService = new OTPService()) {}

  /**
   * POST /api/auth/send-email-otp
   */
  public sendEmailOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.sendEmailOTP(req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          expiresAt: result.expiresAt,
          resendCount: result.resendCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/verify-email-otp
   */
  public verifyEmailOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.verifyEmailOTP(req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          verifiedAt: result.verifiedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/resend-email-otp
   */
  public resendEmailOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.resendEmailOTP(req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          expiresAt: result.expiresAt,
          resendCount: result.resendCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/cleanup-otps (Admin / Cron trigger)
   */
  public cleanupOTPs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cleanedCount = await this.otpService.cleanupExpiredOTPs();
      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${cleanedCount} expired or stale OTP records.`,
        data: {
          cleanedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
