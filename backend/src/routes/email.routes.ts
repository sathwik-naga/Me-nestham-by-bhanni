import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();
const controller = new EmailController();

// All email routes are administrative and protected
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/logs', (req, res, next) => controller.listLogs(req, res, next));
router.get('/metrics', (req, res, next) => controller.getMetrics(req, res, next));
router.post('/retry/:id', (req, res, next) => controller.retryEmail(req, res, next));

export default router;
