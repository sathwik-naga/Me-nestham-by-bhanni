import { Request, Response, NextFunction } from 'express';
import { ContactRepository } from '../repositories/contact.repository';
import { ContactStatus } from '../interfaces/contact.interface';
import { AppError } from '../middleware/error';

const contactRepository = new ContactRepository();

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export class AdminContactController {
  /**
   * Get paginated contact messages with search & status filters
   * GET /api/admin/contact-messages
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';

      const result = await contactRepository.getPaginated({
        page,
        limit,
        search,
        status,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread contact message count for badge & dashboard
   * GET /api/admin/contact-messages/unread-count
   */
  async getUnreadCount(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await contactRepository.getUnreadCount();
      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update message status (read, replied, archived, deleted)
   * PATCH /api/admin/contact-messages/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isUUID(id)) {
        throw new AppError('Invalid contact message UUID format', 400);
      }

      const validStatuses: ContactStatus[] = ['new', 'read', 'replied', 'archived', 'deleted'];
      if (!status || !validStatuses.includes(status as ContactStatus)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const updated = await contactRepository.updateStatus(id, status as ContactStatus);

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete a message
   * DELETE /api/admin/contact-messages/:id
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!isUUID(id)) {
        throw new AppError('Invalid contact message UUID format', 400);
      }

      const deleted = await contactRepository.softDelete(id);

      res.status(200).json({
        success: true,
        message: 'Contact message soft-deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export contact messages as CSV
   * GET /api/admin/contact-messages/export-csv
   */
  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';

      const messages = await contactRepository.getAllForExport(status, search);

      const headers = ['ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'IP Address', 'Created At'];
      const csvRows = [headers.join(',')];

      for (const msg of messages) {
        const row = [
          `"${msg.id}"`,
          `"${(msg.name || '').replace(/"/g, '""')}"`,
          `"${(msg.email || '').replace(/"/g, '""')}"`,
          `"${(msg.phone || '').replace(/"/g, '""')}"`,
          `"${(msg.subject || '').replace(/"/g, '""')}"`,
          `"${(msg.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${msg.status}"`,
          `"${msg.ip_address || ''}"`,
          `"${msg.created_at}"`,
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="contact_messages_${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
