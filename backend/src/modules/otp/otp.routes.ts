import { Router } from 'express';
import { OTPController } from './otp.controller';
import { validate } from '../../middleware/validate';
import { otpSendLimiter, otpVerifyLimiter } from '../../middleware/rateLimiter';
import {
  sendEmailOTPSchema,
  verifyEmailOTPSchema,
  resendEmailOTPSchema,
  sendPhoneOTPSchema,
  verifyPhoneOTPSchema,
  resendPhoneOTPSchema,
} from './otp.validation';

const router = Router();
const otpController = new OTPController();

// Email OTP Endpoints
router.post('/send-email-otp', otpSendLimiter, validate(sendEmailOTPSchema), otpController.sendEmailOTP);
router.post('/verify-email-otp', otpVerifyLimiter, validate(verifyEmailOTPSchema), otpController.verifyEmailOTP);
router.post('/resend-email-otp', otpSendLimiter, validate(resendEmailOTPSchema), otpController.resendEmailOTP);

// Phone OTP Endpoints
router.post('/send-phone-otp', otpSendLimiter, validate(sendPhoneOTPSchema), otpController.sendPhoneOTP);
router.post('/verify-phone-otp', otpVerifyLimiter, validate(verifyPhoneOTPSchema), otpController.verifyPhoneOTP);
router.post('/resend-phone-otp', otpSendLimiter, validate(resendPhoneOTPSchema), otpController.resendPhoneOTP);

export default router;
