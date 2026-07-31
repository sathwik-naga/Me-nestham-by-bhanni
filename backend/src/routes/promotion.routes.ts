import { Router } from 'express';
import { PromotionController } from '../controllers/promotion.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();
const controller = new PromotionController();

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// ==========================================
router.get('/announcements/active', (req, res, next) => controller.getActiveAnnouncement(req, res, next));
router.get('/flash-sales/active', (req, res, next) => controller.getActiveFlashSale(req, res, next));

// ==========================================
// CUSTOMER PROTECTED ROUTES (Auth Required)
// ==========================================
router.use(authMiddleware);

router.post('/validate', (req, res, next) => controller.validateCoupon(req, res, next));
router.post('/apply', (req, res, next) => controller.applyCoupon(req, res, next));
router.post('/remove', (req, res, next) => controller.removeCoupon(req, res, next));

router.post('/gift-cards/apply', (req, res, next) => controller.applyGiftCard(req, res, next));
router.post('/gift-cards/remove', (req, res, next) => controller.removeGiftCard(req, res, next));

// ==========================================
// ADMIN ONLY ROUTES (Admin Role Required)
// ==========================================
router.use(roleMiddleware('admin'));

// Simulator, Stats & Bulk Actions
router.post('/simulate', (req, res, next) => controller.simulatePromotion(req, res, next));
router.get('/stats', (req, res, next) => controller.getMarketingStats(req, res, next));
router.post('/bulk', (req, res, next) => controller.bulkUpdate(req, res, next));

// Coupons CRUD
router.get('/', (req, res, next) => controller.listCoupons(req, res, next));
router.post('/', (req, res, next) => controller.createCoupon(req, res, next));
router.post('/:id/duplicate', (req, res, next) => controller.duplicateCoupon(req, res, next));
router.put('/:id', (req, res, next) => controller.updateCoupon(req, res, next));
router.delete('/:id', (req, res, next) => controller.deleteCoupon(req, res, next));

// Gift Cards CRUD
router.get('/gift-cards', (req, res, next) => controller.listGiftCards(req, res, next));
router.post('/gift-cards', (req, res, next) => controller.createGiftCard(req, res, next));
router.put('/gift-cards/:id', (req, res, next) => controller.updateGiftCard(req, res, next));
router.delete('/gift-cards/:id', (req, res, next) => controller.deleteGiftCard(req, res, next));

// Flash Sales CRUD
router.get('/flash-sales', (req, res, next) => controller.listFlashSales(req, res, next));
router.post('/flash-sales', (req, res, next) => controller.createFlashSale(req, res, next));
router.put('/flash-sales/:id', (req, res, next) => controller.updateFlashSale(req, res, next));
router.delete('/flash-sales/:id', (req, res, next) => controller.deleteFlashSale(req, res, next));

// Announcements CRUD
router.get('/announcements', (req, res, next) => controller.listAnnouncements(req, res, next));
router.post('/announcements', (req, res, next) => controller.createAnnouncement(req, res, next));
router.put('/announcements/:id', (req, res, next) => controller.updateAnnouncement(req, res, next));
router.delete('/announcements/:id', (req, res, next) => controller.deleteAnnouncement(req, res, next));

export default router;
