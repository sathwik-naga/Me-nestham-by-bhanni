import { OTPService } from '../modules/otp/otp.service';
import { supabaseAdmin } from '../lib/supabase';
import logger from '../utils/logger';

export class CronMaintenanceService {
  private static instance: CronMaintenanceService;
  private otpService: OTPService = new OTPService();
  private intervalTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): CronMaintenanceService {
    if (!CronMaintenanceService.instance) {
      CronMaintenanceService.instance = new CronMaintenanceService();
    }
    return CronMaintenanceService.instance;
  }

  /**
   * Start scheduled background maintenance engine (Runs every 1 hour)
   */
  public startMaintenanceEngine(): void {
    const ONE_HOUR = 60 * 60 * 1000;

    logger.info('🚀 Production Maintenance Cron Engine started (1-hour cycle).');

    // Run initial cleanup cycle on server boot
    this.executeMaintenanceCycle();

    this.intervalTimer = setInterval(() => {
      this.executeMaintenanceCycle();
    }, ONE_HOUR);
  }

  /**
   * Stop background maintenance engine
   */
  public stopMaintenanceEngine(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      logger.info('Production Maintenance Cron Engine stopped.');
    }
  }

  /**
   * Execute full background maintenance cycle
   */
  public async executeMaintenanceCycle(): Promise<void> {
    logger.info('[CRON MAINT] Starting automated background maintenance cycle...');

    try {
      // 1. Delete Expired OTPs
      const cleanedOTPs = await this.otpService.cleanupExpiredOTPs();

      // 2. Delete Stale / Unconfirmed Cart Items older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cleanedCarts } = await supabaseAdmin
        .from('cart')
        .delete()
        .lt('created_at', thirtyDaysAgo)
        .select('id');

      // 3. Verify & Flag Stale Pending Payment Orders older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: updatedOrders } = await supabaseAdmin
        .from('orders')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('payment_status', 'PENDING')
        .eq('status', 'PENDING')
        .lt('created_at', twentyFourHoursAgo)
        .select('id');

      logger.info(
        `[CRON MAINT] Cycle Complete: Cleaned ${cleanedOTPs} OTPs, ${cleanedCarts?.length || 0} stale carts, cancelled ${updatedOrders?.length || 0} abandoned pending orders.`
      );
    } catch (err: any) {
      logger.error(`[CRON MAINT] Error during background maintenance cycle: ${err?.message}`);
    }
  }
}

export const cronMaintenance = CronMaintenanceService.getInstance();
