import { Router } from 'express';
import { ObservabilityController } from './observability.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';

const router = Router();
const controller = new ObservabilityController();

// Root Health Check Endpoints (For Render deployment health checks)
router.get('/', controller.getRootHealth);
router.head('/', controller.getRootHealth);

// Public Health Check APIs (Module 4)
router.get('/health', controller.getSystemOverview);
router.get('/health/database', controller.getDatabaseHealth);
router.get('/health/storage', controller.getStorageHealth);
router.get('/health/email', controller.getEmailHealth);
router.get('/health/payment', controller.getPaymentHealth);

// Admin Observability & Audit Log APIs (Modules 1, 3, 5, 8, 9, 10)
router.get('/admin/observability/dashboard', authMiddleware, roleMiddleware('admin'), controller.getAdminDashboardData);
router.get('/admin/observability/audit-logs', authMiddleware, roleMiddleware('admin'), controller.getAuditLogs);

export default router;
