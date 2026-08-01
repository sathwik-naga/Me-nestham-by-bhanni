import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';

import { registerLimiter, loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter';
import otpRoutes from '../modules/otp/otp.routes';

const router = Router();
const authController = new AuthController();

// OTP Module Endpoints (/api/auth/send-email-otp, /api/auth/verify-email-otp, etc.)
router.use('/', otpRoutes);

router.post('/register', registerLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', loginLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/verify-2fa-login', (req, res, next) => authController.verify2FALogin(req, res, next));
router.post('/forgot-password', forgotPasswordLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authMiddleware, (req, res, next) => authController.resetPassword(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.get('/users', authMiddleware, roleMiddleware('admin'), (req, res, next) => authController.listUsers(req, res, next));

export default router;
