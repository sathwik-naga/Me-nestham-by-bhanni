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
   * POST /api/auth/send-phone-otp
   */
  public sendPhoneOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.sendPhoneOTP(req.body);
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
   * POST /api/auth/verify-phone-otp
   */
  public verifyPhoneOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.verifyPhoneOTP(req.body);
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
   * POST /api/auth/resend-phone-otp
   */
  public resendPhoneOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.otpService.resendPhoneOTP(req.body);
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
}
