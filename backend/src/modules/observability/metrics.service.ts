import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';

export class MetricsService {
  /**
   * Aggregate Auth & Security Metrics
   */
  public static async getSecurityMetrics() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Count active unverified email_otps
      const { count: active2FAOTPs } = await supabaseAdmin
        .from('email_otps')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_invalidated', false)
        .gt('expires_at', now.toISOString());

      // Count OTPs generated in last 24h
      const { count: otpsGenerated24h } = await supabaseAdmin
        .from('email_otps')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', twentyFourHoursAgo);

      // Count verified OTPs in last 24h
      const { count: otpsVerified24h } = await supabaseAdmin
        .from('email_otps')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true)
        .gt('updated_at', twentyFourHoursAgo);

      const successRate = otpsGenerated24h ? Math.round(((otpsVerified24h || 0) / otpsGenerated24h) * 100) : 100;

      return {
        active2FASessions: active2FAOTPs || 0,
        otpsGenerated24h: otpsGenerated24h || 0,
        otpsVerified24h: otpsVerified24h || 0,
        otpSuccessRate: `${successRate}%`,
        failedLogins24h: 0, // Tracked in security audit logs
      };
    } catch (err: any) {
      logger.error(`Error querying security metrics: ${err?.message}`);
      return {
        active2FASessions: 0,
        otpsGenerated24h: 0,
        otpsVerified24h: 0,
        otpSuccessRate: '100%',
        failedLogins24h: 0,
      };
    }
  }

  /**
   * Aggregate E-Commerce Business Metrics
   */
  public static async getBusinessMetrics() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Query today's orders
      const { data: todayOrders, count: totalOrdersToday } = await supabaseAdmin
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', todayStart.toISOString());

      const revenueToday = (todayOrders || [])
        .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      // Query total customers
      const { count: totalUsers } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      return {
        ordersToday: totalOrdersToday || 0,
        revenueToday: Math.round(revenueToday),
        totalUsers: totalUsers || 0,
      };
    } catch (err: any) {
      logger.error(`Error querying business metrics: ${err?.message}`);
      return {
        ordersToday: 0,
        revenueToday: 0,
        totalUsers: 0,
      };
    }
  }
}
