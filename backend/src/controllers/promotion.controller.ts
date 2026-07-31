import { Request, Response, NextFunction } from 'express';
import { PromotionService } from '../services/promotion.service';
import { PromotionRepository } from '../repositories/promotion.repository';
import { AppError } from '../middleware/error';

const promotionRepository = new PromotionRepository();
const promotionService = new PromotionService(promotionRepository);

export class PromotionController {
  // ==========================================
  // CUSTOMER / PUBLIC METHODS
  // ==========================================

  async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized: Session not found', 401);
      const { code } = req.body;
      if (!code) throw new AppError('Coupon code is required', 400);

      const result = await promotionService.validateCoupon(req.user.id, code);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized: Session not found', 401);
      const { code } = req.body;
      if (!code) throw new AppError('Coupon code is required', 400);

      const coupon = await promotionService.applyCoupon(req.user.id, code);
      res.status(200).json({
        status: 'success',
        message: 'Coupon applied successfully',
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized: Session not found', 401);
      await promotionService.removeCoupon(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Coupon removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async applyGiftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized: Session not found', 401);
      const { code } = req.body;
      if (!code) throw new AppError('Gift card code is required', 400);

      const giftCard = await promotionService.applyGiftCard(req.user.id, code);
      res.status(200).json({
        status: 'success',
        message: 'Gift card applied successfully',
        data: { giftCard },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeGiftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Unauthorized: Session not found', 401);
      await promotionService.removeGiftCard(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Gift card removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcement = await promotionService.getActiveAnnouncement();
      res.status(200).json({
        status: 'success',
        data: { announcement },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveFlashSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flashSale = await promotionService.getActiveFlashSale();
      res.status(200).json({
        status: 'success',
        data: {
          flashSale,
          server_time: new Date().toISOString(), // Server clock synchronization
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN METHODS (COUPONS)
  // ==========================================

  async listCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));
      const search = req.query.search as string || undefined;
      const sortBy = req.query.sortBy as string || 'created_at';
      const sortOrder = req.query.sortOrder as string || 'desc';
      const isAutomatic = req.query.isAutomatic === 'true' ? true : req.query.isAutomatic === 'false' ? false : undefined;

      const result = await promotionService.listCoupons(page, limit, search, sortBy, sortOrder, isAutomatic);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const coupon = await promotionService.createCoupon(adminId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Coupon created successfully',
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      const coupon = await promotionService.updateCoupon(adminId, id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Coupon updated successfully',
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      await promotionService.deleteCoupon(adminId, id);
      res.status(200).json({
        status: 'success',
        message: 'Coupon deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async duplicateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      const coupon = await promotionService.duplicateCoupon(adminId, id);
      res.status(201).json({
        status: 'success',
        message: 'Coupon duplicated successfully',
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN METHODS (GIFT CARDS)
  // ==========================================

  async listGiftCards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));
      const search = req.query.search as string || undefined;

      const result = await promotionService.listGiftCards(page, limit, search);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createGiftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const giftCard = await promotionService.createGiftCard(adminId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Gift card created successfully',
        data: { giftCard },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGiftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      const giftCard = await promotionService.updateGiftCard(adminId, id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Gift card updated successfully',
        data: { giftCard },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteGiftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      await promotionService.deleteGiftCard(adminId, id);
      res.status(200).json({
        status: 'success',
        message: 'Gift card deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN METHODS (FLASH SALES)
  // ==========================================

  async listFlashSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));

      const result = await promotionService.listFlashSales(page, limit);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createFlashSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const flashSale = await promotionService.createFlashSale(adminId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Flash sale created successfully',
        data: { flashSale },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFlashSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      const flashSale = await promotionService.updateFlashSale(adminId, id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Flash sale updated successfully',
        data: { flashSale },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFlashSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      await promotionService.deleteFlashSale(adminId, id);
      res.status(200).json({
        status: 'success',
        message: 'Flash sale deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN METHODS (ANNOUNCEMENTS)
  // ==========================================

  async listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));

      const result = await promotionService.listAnnouncements(page, limit);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const announcement = await promotionService.createAnnouncement(adminId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Announcement created successfully',
        data: { announcement },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      const announcement = await promotionService.updateAnnouncement(adminId, id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Announcement updated successfully',
        data: { announcement },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { id } = req.params;
      await promotionService.deleteAnnouncement(adminId, id);
      res.status(200).json({
        status: 'success',
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SIMULATOR & BULK & STATS METHODS
  // ==========================================

  async simulatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draftCoupon, mockItems } = req.body;
      if (!draftCoupon || !mockItems) {
        throw new AppError('draftCoupon and mockItems are required for simulation', 400);
      }

      const result = await promotionService.simulatePromotion(draftCoupon, mockItems);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id || null;
      const { targetTable, ids, action } = req.body;
      
      if (!targetTable || !ids || !action) {
        throw new AppError('targetTable, ids, and action are required', 400);
      }
      if (!['coupons', 'gift_cards'].includes(targetTable)) {
        throw new AppError('Invalid target table', 400);
      }
      if (!['ENABLE', 'DISABLE', 'DELETE'].includes(action)) {
        throw new AppError('Invalid action', 400);
      }

      await promotionService.bulkUpdate(adminId, targetTable, ids, action);
      res.status(200).json({
        status: 'success',
        message: `Bulk ${action.toLowerCase()} operation executed successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMarketingStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await promotionService.getMarketingStats();
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
export const promotionController = new PromotionController();
