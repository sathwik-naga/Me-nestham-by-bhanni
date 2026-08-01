import { Router } from 'express';
import { OTPController } from './otp.controller';
import { validate } from '../../middleware/validate';
import { otpSendLimiter, otpVerifyLimiter } from '../../middleware/rateLimiter';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import {
  sendEmailOTPSchema,
  verifyEmailOTPSchema,
  resendEmailOTPSchema,
} from './otp.validation';

const router = Router();
const otpController = new OTPController();

// Email 2FA OTP Endpoints
router.post('/send-email-otp', otpSendLimiter, validate(sendEmailOTPSchema), otpController.sendEmailOTP);
router.post('/verify-email-otp', otpVerifyLimiter, validate(verifyEmailOTPSchema), otpController.verifyEmailOTP);
router.post('/resend-email-otp', otpSendLimiter, validate(resendEmailOTPSchema), otpController.resendEmailOTP);

// System Maintenance / Admin Cleanup Trigger
router.post('/cleanup-otps', authMiddleware, roleMiddleware('admin'), otpController.cleanupOTPs);

export default router;
