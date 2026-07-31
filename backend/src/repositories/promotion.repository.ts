import { supabaseAdmin } from '../lib/supabase';
import {
  Coupon,
  CouponUsage,
  CouponFailure,
  FlashSale,
  Announcement,
  GiftCard,
  GiftCardUsage,
  PromotionAuditLog,
  MarketingStats
} from '../interfaces/promotion.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class PromotionRepository {
  private logDbError(table: string, operation: string, error: any) {
    logger.error({
      message: `Database error during ${operation} on ${table}`,
      metadata: {
        repository: 'PromotionRepository',
        table,
        operation,
        code: error.code || null,
        errorMessage: error.message || String(error)
      }
    });
  }

  private isSchemaError(error: any): boolean {
    return error && (error.code === '42P01' || error.code === 'PGRST205');
  }

  // ==========================================
  // COUPON DB OPERATIONS
  // ==========================================

  async getById(id: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        if (this.isSchemaError(error)) {
          this.logDbError('coupons', 'getById', error);
          return null;
        }
        this.logDbError('coupons', 'getById', error);
        throw new AppError('Failed to fetch coupon details', 500);
      }

      return data as Coupon;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('coupons', 'getById (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching coupon ID ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getByCode(code: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        if (this.isSchemaError(error)) {
          this.logDbError('coupons', 'getByCode', error);
          return null;
        }
        this.logDbError('coupons', 'getByCode', error);
        throw new AppError('Failed to fetch coupon details', 500);
      }

      return data as Coupon;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('coupons', 'getByCode (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching coupon code ${code}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'times_used'>): Promise<Coupon> {
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .insert([coupon])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating coupon: ${error.message}`);
        throw new AppError(error.message || 'Failed to create coupon', 500);
      }

      return data as Coupon;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating coupon: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async updateCoupon(id: string, coupon: Partial<Omit<Coupon, 'id' | 'created_at' | 'updated_at'>>): Promise<Coupon> {
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .update(coupon)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating coupon ${id}: ${error.message}`);
        throw new AppError('Failed to update coupon details', 500);
      }

      return data as Coupon;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating coupon ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async deleteCoupon(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Database error deleting coupon ${id}: ${error.message}`);
        throw new AppError('Failed to delete coupon', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleting coupon ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getAllCoupons(
    page: number,
    limit: number,
    search?: string,
    sortBy = 'created_at',
    sortOrder = 'desc',
    isAutomatic?: boolean
  ): Promise<{ coupons: Coupon[]; count: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseAdmin
        .from('coupons')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`code.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (isAutomatic !== undefined) {
        query = query.eq('is_automatic', isAutomatic);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        logger.error(`Database error fetching all coupons: ${error.message}`);
        throw new AppError('Failed to fetch coupons list', 500);
      }

      return {
        coupons: (data || []) as Coupon[],
        count: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error listing coupons: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getAutomaticPromotions(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('is_automatic', true)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        if (this.isSchemaError(error)) {
          this.logDbError('coupons', 'getAutomaticPromotions', error);
          return [];
        }
        this.logDbError('coupons', 'getAutomaticPromotions', error);
        throw new AppError('Failed to fetch automatic promotions', 500);
      }

      return data as Coupon[];
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('coupons', 'getAutomaticPromotions (exception)', err);
        return [];
      }
      logger.error(`Unexpected error fetching automatic promos: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async incrementUsageCount(id: string): Promise<void> {
    try {
      // Execute raw update or direct balance update using rpc or single fetch/write
      const { data: coupon, error: fetchErr } = await supabaseAdmin
        .from('coupons')
        .select('times_used')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      const { error: updateErr } = await supabaseAdmin
        .from('coupons')
        .update({ times_used: (coupon.times_used || 0) + 1 })
        .eq('id', id);

      if (updateErr) throw updateErr;
    } catch (err) {
      logger.error(`Failed to increment coupon ${id} usage count: ${err}`);
    }
  }

  // ==========================================
  // COUPON USAGE RECORDING
  // ==========================================

  async createUsage(usage: Omit<CouponUsage, 'id' | 'used_at'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('coupon_usage')
        .insert([usage]);

      if (error) {
        logger.error(`Database error inserting coupon usage: ${error.message}`);
        throw new AppError('Failed to record coupon usage', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error inserting coupon usage: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getUserCouponUsageCount(userId: string, couponId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('coupon_id', couponId);

      if (error) {
        if (this.isSchemaError(error)) {
          this.logDbError('coupon_usage', 'getUserCouponUsageCount', error);
          return 0;
        }
        this.logDbError('coupon_usage', 'getUserCouponUsageCount', error);
        throw new AppError('Failed to fetch user coupon usage count', 500);
      }

      return count || 0;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('coupon_usage', 'getUserCouponUsageCount (exception)', err);
        return 0;
      }
      logger.error(`Unexpected error fetching user coupon usage: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getUserTotalOrdersCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'cancelled');

      if (error) {
        if (this.isSchemaError(error)) {
          this.logDbError('orders', 'getUserTotalOrdersCount', error);
          return 0;
        }
        this.logDbError('orders', 'getUserTotalOrdersCount', error);
        throw new AppError('Failed to fetch user total orders count', 500);
      }

      return count || 0;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('orders', 'getUserTotalOrdersCount (exception)', err);
        return 0;
      }
      logger.error(`Unexpected error fetching user orders count: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  // ==========================================
  // COUPON FAILURE LOGGING
  // ==========================================

  async createFailure(failure: Omit<CouponFailure, 'id' | 'attempted_at'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('coupon_failures')
        .insert([failure]);

      if (error) {
        logger.error(`Database error logging coupon failure: ${error.message}`);
      }
    } catch (err) {
      logger.error(`Unexpected error logging coupon failure: ${err}`);
    }
  }

  // ==========================================
  // GIFT CARD OPERATIONS
  // ==========================================

  async getGiftCardByCode(code: string): Promise<GiftCard | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        if (this.isSchemaError(error)) {
          this.logDbError('gift_cards', 'getGiftCardByCode', error);
          return null;
        }
        this.logDbError('gift_cards', 'getGiftCardByCode', error);
        throw new AppError('Failed to fetch gift card details', 500);
      }

      return data as GiftCard;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('gift_cards', 'getGiftCardByCode (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching gift card ${code}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async getGiftCardById(id: string): Promise<GiftCard | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        if (this.isSchemaError(error)) {
          this.logDbError('gift_cards', 'getGiftCardById', error);
          return null;
        }
        this.logDbError('gift_cards', 'getGiftCardById', error);
        throw new AppError('Failed to fetch gift card details', 500);
      }

      return data as GiftCard;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('gift_cards', 'getGiftCardById (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching gift card ID ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async createGiftCard(gc: Omit<GiftCard, 'id' | 'created_at' | 'updated_at'>): Promise<GiftCard> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .insert([gc])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating gift card: ${error.message}`);
        throw new AppError(error.message || 'Failed to create gift card', 500);
      }

      return data as GiftCard;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating gift card: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async updateGiftCard(id: string, gc: Partial<Omit<GiftCard, 'id' | 'created_at' | 'updated_at'>>): Promise<GiftCard> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .update(gc)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating gift card ${id}: ${error.message}`);
        throw new AppError('Failed to update gift card', 500);
      }

      return data as GiftCard;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating gift card ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async deleteGiftCard(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('gift_cards')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Database error deleting gift card ${id}: ${error.message}`);
        throw new AppError('Failed to delete gift card', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleting gift card ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async listGiftCards(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ giftCards: GiftCard[]; count: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseAdmin
        .from('gift_cards')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('code', `%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        logger.error(`Database error listing gift cards: ${error.message}`);
        throw new AppError('Failed to list gift cards', 500);
      }

      return {
        giftCards: (data || []) as GiftCard[],
        count: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error listing gift cards: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async decrementGiftCardBalance(id: string, amount: number): Promise<void> {
    try {
      const { data: gc, error: getErr } = await supabaseAdmin
        .from('gift_cards')
        .select('balance')
        .eq('id', id)
        .single();

      if (getErr) throw getErr;

      const newBalance = Math.max(0, Number(gc.balance || 0) - amount);

      const { error: updateErr } = await supabaseAdmin
        .from('gift_cards')
        .update({ balance: newBalance })
        .eq('id', id);

      if (updateErr) throw updateErr;
    } catch (err) {
      logger.error(`Failed to decrement gift card ${id} balance: ${err}`);
      throw new AppError('Failed to process gift card deduction', 500);
    }
  }

  async createGiftCardUsage(usage: Omit<GiftCardUsage, 'id' | 'used_at'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('gift_card_usage')
        .insert([usage]);

      if (error) {
        logger.error(`Database error creating gift card usage: ${error.message}`);
        throw new AppError('Failed to record gift card transaction details', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error inserting gift card usage: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  // ==========================================
  // FLASH SALES DB OPERATIONS
  // ==========================================

  async getActiveFlashSale(): Promise<FlashSale | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('starts_at', { ascending: false })
        .limit(1);

      if (error) {
        if (this.isSchemaError(error)) {
          this.logDbError('flash_sales', 'getActiveFlashSale', error);
          return null;
        }
        this.logDbError('flash_sales', 'getActiveFlashSale', error);
        throw new AppError('Failed to fetch active flash sale details', 500);
      }

      return data && data.length > 0 ? (data[0] as FlashSale) : null;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('flash_sales', 'getActiveFlashSale (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching active flash sale: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async listFlashSales(page: number, limit: number): Promise<{ flashSales: FlashSale[]; count: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabaseAdmin
        .from('flash_sales')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error(`Database error listing flash sales: ${error.message}`);
        throw new AppError('Failed to list flash sales', 500);
      }

      return {
        flashSales: (data || []) as FlashSale[],
        count: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error listing flash sales: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async createFlashSale(fs: Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>): Promise<FlashSale> {
    try {
      const { data, error } = await supabaseAdmin
        .from('flash_sales')
        .insert([fs])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating flash sale: ${error.message}`);
        throw new AppError('Failed to create flash sale', 500);
      }

      return data as FlashSale;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating flash sale: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async updateFlashSale(id: string, fs: Partial<Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>>): Promise<FlashSale> {
    try {
      const { data, error } = await supabaseAdmin
        .from('flash_sales')
        .update(fs)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating flash sale ${id}: ${error.message}`);
        throw new AppError('Failed to update flash sale', 500);
      }

      return data as FlashSale;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating flash sale ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async deleteFlashSale(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('flash_sales')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Database error deleting flash sale ${id}: ${error.message}`);
        throw new AppError('Failed to delete flash sale', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleting flash sale ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  // ==========================================
  // ANNOUNCEMENTS DB OPERATIONS
  // ==========================================

  async getActiveAnnouncement(): Promise<Announcement | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        if (this.isSchemaError(error)) {
          this.logDbError('announcements', 'getActiveAnnouncement', error);
          return null;
        }
        this.logDbError('announcements', 'getActiveAnnouncement', error);
        throw new AppError('Failed to fetch active announcement details', 500);
      }

      return data && data.length > 0 ? (data[0] as Announcement) : null;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (this.isSchemaError(err)) {
        this.logDbError('announcements', 'getActiveAnnouncement (exception)', err);
        return null;
      }
      logger.error(`Unexpected error fetching active announcement: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async listAnnouncements(page: number, limit: number): Promise<{ announcements: Announcement[]; count: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabaseAdmin
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error(`Database error listing announcements: ${error.message}`);
        throw new AppError('Failed to list announcements', 500);
      }

      return {
        announcements: (data || []) as Announcement[],
        count: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error listing announcements: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async createAnnouncement(ann: any): Promise<any> {
    try {
      const response = await supabaseAdmin
        .from('announcements')
        .insert([ann])
        .select()
        .single();

      if (response.error) {
        logger.error(`Database error creating announcement: ${response.error.message}`);
        throw new AppError('Failed to create announcement', 500);
      }

      return response.data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating announcement: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async updateAnnouncement(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating announcement ${id}: ${error.message}`);
        throw new AppError('Failed to update announcement', 500);
      }

      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating announcement ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Database error deleting announcement ${id}: ${error.message}`);
        throw new AppError('Failed to delete announcement', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleting announcement ${id}: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  async createAuditLog(log: Omit<PromotionAuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('promotion_audit_logs')
        .insert([log]);

      if (error) {
        logger.error(`Database error inserting audit log: ${error.message}`);
      }
    } catch (err) {
      logger.error(`Unexpected error inserting audit log: ${err}`);
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkUpdateStatus(targetTable: 'coupons' | 'gift_cards', ids: string[], isActive: boolean): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(targetTable)
        .update({ is_active: isActive })
        .in('id', ids);

      if (error) {
        logger.error(`Database error during bulk update on ${targetTable}: ${error.message}`);
        throw new AppError('Failed to execute bulk update', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in bulk update: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  async bulkDelete(targetTable: 'coupons' | 'gift_cards', ids: string[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(targetTable)
        .delete()
        .in('id', ids);

      if (error) {
        logger.error(`Database error during bulk delete on ${targetTable}: ${error.message}`);
        throw new AppError('Failed to execute bulk delete', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in bulk delete: ${err}`);
      throw new AppError('Internal database error', 500);
    }
  }

  // ==========================================
  // STATISTICS & ANALYTICS AGGREGATIONS
  // ==========================================

  async getMarketingStats(): Promise<MarketingStats> {
    const defaultStats: MarketingStats = {
      totalCouponsCreated: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      totalRedemptions: 0,
      revenueInfluenced: 0,
      averageDiscountPerOrder: 0,
      revenueSavedByCustomers: 0,
      averageDiscountPercentage: 0,
      topPerformingCampaigns: [],
      topFailedCoupons: [],
      dailyUsage: [],
      weeklyUsage: [],
      monthlyUsage: [],
      flashSalePerformance: []
    };

    try {
      // 1. Coupons count (total, active, expired)
      let coupons: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('coupons')
          .select('id, is_active, expires_at');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('coupons', 'getMarketingStats:coupons', error);
          } else {
            throw error;
          }
        } else {
          coupons = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('coupons', 'getMarketingStats:coupons:catch', err);
          throw err;
        }
      }

      const totalCoupons = coupons.length;
      const activeCoupons = coupons.filter(c => c.is_active).length;
      const expiredCoupons = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;

      // 2. Redemptions & Savings from coupon_usage
      let usages: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('coupon_usage')
          .select('discount_amount, used_at, coupon_id');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('coupon_usage', 'getMarketingStats:usages', error);
          } else {
            throw error;
          }
        } else {
          usages = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('coupon_usage', 'getMarketingStats:usages:catch', err);
          throw err;
        }
      }

      const totalRedemptions = usages.length;
      const revenueSaved = usages.reduce((sum, u) => sum + Number(u.discount_amount), 0);

      // 3. Orders stats (Grand totals and averages)
      let orders: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('id, grand_total, discount, coupon_code');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('orders', 'getMarketingStats:orders', error);
          } else {
            throw error;
          }
        } else {
          orders = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('orders', 'getMarketingStats:orders:catch', err);
          throw err;
        }
      }

      const couponOrders = orders.filter(o => o.coupon_code);
      const revenueInfluenced = couponOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);
      const totalDiscountGiven = orders.reduce((sum, o) => sum + Number(o.discount), 0);
      const averageDiscount = orders.length > 0 ? (totalDiscountGiven / orders.length) : 0;
      
      const totalSubtotal = orders.reduce((sum, o) => sum + (Number(o.grand_total) + Number(o.discount)), 0);
      const averageDiscountPercent = totalSubtotal > 0 ? (totalDiscountGiven / totalSubtotal) * 100 : 0;

      // 4. Top Performing Campaigns (joining coupon table groupings)
      const campaignPerfMap: Record<string, { code: string; title: string; usages: number; savings: number; rev: number }> = {};
      
      let couponsWithCode: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('coupons')
          .select('id, code, title, times_used');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('coupons', 'getMarketingStats:couponsWithCode', error);
          } else {
            throw error;
          }
        } else {
          couponsWithCode = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('coupons', 'getMarketingStats:couponsWithCode:catch', err);
          throw err;
        }
      }

      couponsWithCode.forEach(c => {
        if (c.code) {
          campaignPerfMap[c.id] = {
            code: c.code,
            title: c.title,
            usages: c.times_used || 0,
            savings: 0,
            rev: 0
          };
        }
      });

      usages.forEach(u => {
        if (campaignPerfMap[u.coupon_id]) {
          campaignPerfMap[u.coupon_id].savings += Number(u.discount_amount);
        }
      });

      couponOrders.forEach(o => {
        const matchingCoupon = couponsWithCode.find(c => c.code?.toUpperCase() === o.coupon_code?.toUpperCase());
        if (matchingCoupon && campaignPerfMap[matchingCoupon.id]) {
          campaignPerfMap[matchingCoupon.id].rev += Number(o.grand_total);
        }
      });

      const topCampaigns = Object.values(campaignPerfMap)
        .map(c => ({
          code: c.code,
          title: c.title,
          times_used: c.usages,
          total_discount: parseFloat(c.savings.toFixed(2)),
          total_revenue: parseFloat(c.rev.toFixed(2))
        }))
        .sort((a, b) => b.times_used - a.times_used)
        .slice(0, 10);

      // 5. Failed coupons attempts log count
      let failures: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('coupon_failures')
          .select('code, reason');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('coupon_failures', 'getMarketingStats:failures', error);
          } else {
            throw error;
          }
        } else {
          failures = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('coupon_failures', 'getMarketingStats:failures:catch', err);
          throw err;
        }
      }

      const failureMap: Record<string, { code: string; reason: string; count: number }> = {};
      failures.forEach(f => {
        const key = `${f.code.toUpperCase()}-${f.reason}`;
        if (!failureMap[key]) {
          failureMap[key] = { code: f.code.toUpperCase(), reason: f.reason, count: 0 };
        }
        failureMap[key].count++;
      });

      const topFailed = Object.values(failureMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 6. Time aggregations: Daily, Weekly, Monthly
      const dailyMap: Record<string, number> = {};
      const weeklyMap: Record<string, number> = {};
      const monthlyMap: Record<string, number> = {};

      usages.forEach(u => {
        const dateObj = new Date(u.used_at);
        const dayStr = dateObj.toISOString().split('T')[0];
        
        const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
        const pastDaysOfYear = (dateObj.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        const weekStr = `${dateObj.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

        const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

        dailyMap[dayStr] = (dailyMap[dayStr] || 0) + 1;
        weeklyMap[weekStr] = (weeklyMap[weekStr] || 0) + 1;
        monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + 1;
      });

      const formatChartData = (map: Record<string, number>) => {
        return Object.entries(map)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30);
      };

      // 7. Flash Sales performance metrics
      let sales: any[] = [];
      try {
        const { data, error } = await supabaseAdmin
          .from('flash_sales')
          .select('id, title');
        if (error) {
          if (this.isSchemaError(error)) {
            this.logDbError('flash_sales', 'getMarketingStats:sales', error);
          } else {
            throw error;
          }
        } else {
          sales = data || [];
        }
      } catch (err: any) {
        if (!this.isSchemaError(err)) {
          this.logDbError('flash_sales', 'getMarketingStats:sales:catch', err);
          throw err;
        }
      }

      const flashPerf = await Promise.all(
        sales.map(async (sale) => {
          try {
            const { data: fullSale, error: fErr } = await supabaseAdmin
              .from('flash_sales')
              .select('*')
              .eq('id', sale.id)
              .single();

            if (fErr) {
              if (this.isSchemaError(fErr)) return { id: sale.id, title: sale.title, revenue: 0, orders_count: 0 };
              throw fErr;
            }

            if (!fullSale) return { id: sale.id, title: sale.title, revenue: 0, orders_count: 0 };

            const start = new Date(fullSale.starts_at).toISOString();
            const end = new Date(fullSale.ends_at).toISOString();

            const { data: fsOrders, error: fsErr } = await supabaseAdmin
              .from('orders')
              .select('grand_total')
              .gte('created_at', start)
              .lte('created_at', end);

            if (fsErr) {
              if (this.isSchemaError(fsErr)) return { id: sale.id, title: sale.title, revenue: 0, orders_count: 0 };
              throw fsErr;
            }

            const totalRev = (fsOrders || []).reduce((sum, o) => sum + Number(o.grand_total), 0);
            return {
              id: sale.id,
              title: sale.title,
              revenue: parseFloat(totalRev.toFixed(2)),
              orders_count: (fsOrders || []).length
            };
          } catch (fsErr: any) {
            if (this.isSchemaError(fsErr)) {
              return { id: sale.id, title: sale.title, revenue: 0, orders_count: 0 };
            }
            throw fsErr;
          }
        })
      );

      return {
        totalCouponsCreated: totalCoupons,
        activeCoupons: activeCoupons,
        expiredCoupons: expiredCoupons,
        totalRedemptions: totalRedemptions,
        revenueInfluenced: parseFloat(revenueInfluenced.toFixed(2)),
        averageDiscountPerOrder: parseFloat(averageDiscount.toFixed(2)),
        revenueSavedByCustomers: parseFloat(revenueSaved.toFixed(2)),
        averageDiscountPercentage: parseFloat(averageDiscountPercent.toFixed(2)),
        topPerformingCampaigns: topCampaigns,
        topFailedCoupons: topFailed,
        dailyUsage: formatChartData(dailyMap),
        weeklyUsage: formatChartData(weeklyMap),
        monthlyUsage: formatChartData(monthlyMap),
        flashSalePerformance: flashPerf
      };
    } catch (err: any) {
      if (this.isSchemaError(err)) {
        this.logDbError('multiple', 'getMarketingStats (fallback default)', err);
        return defaultStats;
      }
      logger.error(`Error aggregating marketing stats: ${err}`);
      throw new AppError('Failed to aggregate marketing statistics', 500);
    }
  }
}
