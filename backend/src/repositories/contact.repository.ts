import { supabaseAdmin } from '../lib/supabase';
import { ContactMessage, CreateContactDto, ContactFilterParams, ContactStatus } from '../interfaces/contact.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class ContactRepository {
  /**
   * Insert a new contact message
   */
  async create(data: CreateContactDto): Promise<ContactMessage> {
    try {
      const { data: inserted, error } = await supabaseAdmin
        .from('contact_messages')
        .insert([
          {
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            ip_address: data.ip_address || null,
            user_agent: data.user_agent || null,
            status: 'new',
            is_deleted: false,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating contact message: ${error.message}`);
        throw new AppError('Failed to save contact message', 500);
      }

      return inserted as ContactMessage;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating contact message: ${err}`);
      throw new AppError('Internal server error during contact submission', 500);
    }
  }

  /**
   * Count recent submissions by IP address in the last X minutes
   */
  async countRecentByIp(ipAddress: string, windowMinutes: number = 60): Promise<number> {
    try {
      const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      const { count, error } = await supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', since);

      if (error) {
        logger.warn(`Error checking IP submission rate: ${error.message}`);
        return 0;
      }
      return count || 0;
    } catch (err) {
      logger.warn(`Unexpected error checking IP submission rate: ${err}`);
      return 0;
    }
  }

  /**
   * Count recent submissions by email address in the last X minutes
   */
  async countRecentByEmail(email: string, windowMinutes: number = 10): Promise<number> {
    try {
      const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      const { count, error } = await supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .gte('created_at', since);

      if (error) {
        logger.warn(`Error checking Email submission rate: ${error.message}`);
        return 0;
      }
      return count || 0;
    } catch (err) {
      logger.warn(`Unexpected error checking Email submission rate: ${err}`);
      return 0;
    }
  }

  /**
   * Check for duplicate email + message submitted in the last X seconds
   */
  async checkDuplicate(email: string, message: string, windowSeconds: number = 60): Promise<boolean> {
    try {
      const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('message', message)
        .gte('created_at', since)
        .limit(1);

      if (error) return false;
      return Array.isArray(data) && data.length > 0;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get single message by ID
   */
  async getById(id: string): Promise<ContactMessage | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new AppError('Failed to fetch contact message', 500);
      }
      return data as ContactMessage;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database query error', 500);
    }
  }

  /**
   * Fetch paginated contact messages excluding soft-deleted records unless requested
   */
  async getPaginated(params: ContactFilterParams & { includeDeleted?: boolean }) {
    try {
      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, Math.min(100, params.limit || 10));
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('contact_messages')
        .select('*', { count: 'exact' });

      if (!params.includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.search) {
        const s = `%${params.search.trim()}%`;
        query = query.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},subject.ilike.${s},message.ilike.${s}`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        logger.error(`Error fetching contact messages list: ${error.message}`);
        throw new AppError('Failed to retrieve contact messages', 500);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []) as ContactMessage[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Internal error retrieving contact messages', 500);
    }
  }

  /**
   * Count unread/new messages for notification badge and dashboard metrics
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
        .eq('is_deleted', false);

      if (error) {
        logger.warn(`Failed to count unread contact messages: ${error.message}`);
        return 0;
      }
      return count || 0;
    } catch (err) {
      return 0;
    }
  }

  /**
   * Update message status with timestamps (read_at, deleted_at)
   */
  async updateStatus(id: string, status: ContactStatus): Promise<ContactMessage> {
    try {
      const now = new Date().toISOString();
      const updates: Record<string, any> = {
        status,
        updated_at: now,
      };

      if (status === 'read' || status === 'replied') {
        updates.read_at = now;
      }

      if (status === 'deleted') {
        updates.is_deleted = true;
        updates.deleted_at = now;
      }

      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Failed to update status for contact message ${id}: ${error.message}`);
        throw new AppError('Failed to update message status', 500);
      }

      return data as ContactMessage;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error updating contact message status', 500);
    }
  }

  /**
   * Soft delete a message
   */
  async softDelete(id: string): Promise<ContactMessage> {
    return this.updateStatus(id, 'deleted');
  }

  /**
   * Fetch all records for CSV Export
   */
  async getAllForExport(status?: string, search?: string): Promise<ContactMessage[]> {
    try {
      let query = supabaseAdmin
        .from('contact_messages')
        .select('*')
        .eq('is_deleted', false);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        const s = `%${search.trim()}%`;
        query = query.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},subject.ilike.${s},message.ilike.${s}`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw new AppError('Failed to fetch data for export', 500);
      return (data || []) as ContactMessage[];
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Error exporting contact messages', 500);
    }
  }
}
