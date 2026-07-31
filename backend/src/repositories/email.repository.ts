import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export type EmailStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  idempotency_key?: string | null;
  status: EmailStatus;
  provider: string;
  provider_message_id?: string | null;
  error_message?: string | null;
  is_retryable?: boolean;
  html_body?: string | null;
  attempts: number;
  metadata: Record<string, any>;
  created_at: string;
  sent_at?: string | null;
  updated_at?: string | null;
}

export interface EmailFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  template?: string;
}

export class EmailRepository {
  /**
   * Check if an email with the given idempotency key already exists and was processed/queued
   */
  async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    if (!idempotencyKey) return false;
    try {
      const { data } = await supabaseAdmin
        .from('email_logs')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (data && (data.status === 'sent' || data.status === 'queued' || data.status === 'processing')) {
        return true;
      }
      return false;
    } catch (err) {
      logger.warn(`Idempotency check error: ${err}`);
      return false;
    }
  }

  /**
   * Create a new email log entry
   */
  async createLog(log: Omit<EmailLog, 'id' | 'created_at'>): Promise<EmailLog> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .insert([log])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating email log: ${error.message}`);
        throw new AppError('Failed to create email log', 500);
      }

      return data as EmailLog;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in EmailRepository.createLog: ${err}`);
      throw new AppError('Internal database error during logging', 500);
    }
  }

  /**
   * Get log by ID
   */
  async getById(id: string): Promise<EmailLog | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as EmailLog;
    } catch (err) {
      return null;
    }
  }

  /**
   * Update the status and properties of an email log
   */
  async updateStatus(id: string, updates: Partial<EmailLog>): Promise<EmailLog> {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
        ...(updates.status === 'sent' ? { sent_at: new Date().toISOString() } : {})
      };

      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating email log status: ${error.message}`);
        throw new AppError('Failed to update email log status', 500);
      }

      return data as EmailLog;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in EmailRepository.updateStatus: ${err}`);
      throw new AppError('Internal database error during status update', 500);
    }
  }

  /**
   * Get paginated email logs with filters
   */
  async getPaginated(params: EmailFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact' });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.template) {
      query = query.eq('template', params.template);
    }

    if (params.search) {
      const s = `%${params.search}%`;
      query = query.or(`recipient.ilike.${s},subject.ilike.${s},template.ilike.${s}`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      logger.error(`Database error fetching email logs: ${error.message}`);
      throw new AppError('Failed to fetch email logs', 500);
    }

    return {
      logs: (data || []) as EmailLog[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get aggregate delivery metrics for admin panel
   */
  async getDeliveryMetrics() {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .select('status, template');

      if (error || !data) {
        return { total: 0, sent: 0, failed: 0, queued: 0, successRate: '100%', topTemplate: 'OrderConfirmationEmail' };
      }

      const total = data.length;
      const sent = data.filter((d) => d.status === 'sent').length;
      const failed = data.filter((d) => d.status === 'failed').length;
      const queued = data.filter((d) => d.status === 'queued' || d.status === 'processing').length;

      const templateCounts: Record<string, number> = {};
      data.forEach((d) => {
        templateCounts[d.template] = (templateCounts[d.template] || 0) + 1;
      });

      let topTemplate = 'OrderConfirmationEmail';
      let maxCount = 0;
      Object.entries(templateCounts).forEach(([tpl, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topTemplate = tpl;
        }
      });

      const successRate = total > 0 ? `${((sent / total) * 100).toFixed(1)}%` : '100%';

      return {
        total,
        sent,
        failed,
        queued,
        successRate,
        topTemplate,
      };
    } catch (err) {
      logger.error(`Error calculating email delivery metrics: ${err}`);
      return { total: 0, sent: 0, failed: 0, queued: 0, successRate: '100%', topTemplate: 'OrderConfirmationEmail' };
    }
  }

  /**
   * Rate limiting duplicate check
   */
  async checkDuplicate(recipient: string, template: string, orderId?: string): Promise<boolean> {
    try {
      const windowTime = new Date(Date.now() - 60000).toISOString(); // 1 minute window
      let query = supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('recipient', recipient)
        .eq('template', template)
        .gte('created_at', windowTime);

      const { data } = await query;
      return Boolean(data && data.length > 0);
    } catch (err) {
      return false;
    }
  }
}
