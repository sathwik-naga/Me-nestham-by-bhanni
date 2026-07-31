import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();
const controller = new ShippingController();

// Public Webhook route (must be registered BEFORE authMiddleware matches)
router.post('/webhook', (req, res, next) => controller.handleWebhook(req, res, next));

// Protected routes require authentication
router.use(authMiddleware);

// Admin-only routing
router.post('/create', roleMiddleware('admin'), (req, res, next) => controller.createShipment(req, res, next));
router.post('/awb', roleMiddleware('admin'), (req, res, next) => controller.generateAwb(req, res, next));
router.post('/pickup', roleMiddleware('admin'), (req, res, next) => controller.schedulePickup(req, res, next));
router.post('/label', roleMiddleware('admin'), (req, res, next) => controller.generateLabel(req, res, next));
router.post('/invoice', roleMiddleware('admin'), (req, res, next) => controller.generateInvoice(req, res, next));
router.post('/manifest', roleMiddleware('admin'), (req, res, next) => controller.generateManifest(req, res, next));
router.post('/:orderId/cancel', roleMiddleware('admin'), (req, res, next) => controller.cancelShipment(req, res, next));

// Tracking and viewing (accessible to admins or the owning customer)
router.get('/:orderId', (req, res, next) => controller.getShipment(req, res, next));
router.get('/:orderId/track', (req, res, next) => controller.trackShipment(req, res, next));

export default router;
