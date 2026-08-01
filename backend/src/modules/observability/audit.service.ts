import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';

export interface AuditLogEntry {
  userId?: string | null;
  email?: string | null;
  action: string; // e.g. 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'OTP_GENERATED', 'OTP_VERIFIED', 'PRODUCT_CREATED', 'ORDER_UPDATED'
  targetType?: string; // e.g. 'AUTH', 'OTP', 'PRODUCT', 'ORDER', 'COUPON'
  targetId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Record a structured security or administrative audit log entry
   */
  public static async log(entry: AuditLogEntry): Promise<void> {
    const {
      userId = null,
      email = null,
      action,
      targetType = 'SYSTEM',
      targetId = null,
      ip = null,
      userAgent = null,
      status = 'SUCCESS',
      details = {},
    } = entry;

    logger.info(`[AUDIT LOG] ${action} | User: ${email || userId || 'Anonymous'} | IP: ${ip || 'Internal'} | Status: ${status}`);

    try {
      await supabaseAdmin.from('promotion_audit_logs').insert({
        user_id: userId,
        action,
        target_type: targetType,
        target_id: targetId || '00000000-0000-0000-0000-000000000000',
        details: {
          ...details,
          email,
          ip,
          userAgent,
          status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      logger.error(`Failed to write audit log to database: ${err?.message}`);
    }
  }

  /**
   * Query recent audit logs for Admin Dashboard
   */
  public static async getRecentAuditLogs(limit = 50, offset = 0) {
    try {
      const { data, count, error } = await supabaseAdmin
        .from('promotion_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    } catch (err: any) {
      logger.error(`Error querying audit logs: ${err?.message}`);
      return { logs: [], total: 0 };
    }
  }
}
