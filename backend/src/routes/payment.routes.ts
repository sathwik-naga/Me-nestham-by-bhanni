import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderValidator, verifyPaymentValidator } from '../validators/payment.validator';

const router = Router();
const paymentController = new PaymentController();

// Public webhook route (must bypass user auth)
router.post('/webhook', (req, res, next) => paymentController.webhook(req, res, next));

// All other payment endpoints require user session authentication
router.use(authMiddleware);

router.post('/create-order', validate(createOrderValidator), (req, res, next) => paymentController.createOrder(req, res, next));
router.post('/verify', validate(verifyPaymentValidator), (req, res, next) => paymentController.verify(req, res, next));

export default router;
