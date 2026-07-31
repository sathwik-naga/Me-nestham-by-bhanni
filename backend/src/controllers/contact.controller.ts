import { Request, Response, NextFunction } from 'express';
import { ContactRepository } from '../repositories/contact.repository';
import { EmailService } from '../services/email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import { AppError } from '../middleware/error';

const contactRepository = new ContactRepository();
const emailService = new EmailService(new EmailRepository(), new ResendProvider());

/**
 * Sanitize string input to prevent script injection and HTML tag execution
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export class ContactController {
  /**
   * Submit contact form
   * POST /api/contact
   */
  async submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, subject, message, honeypot, b_hp } = req.body;

      // Honeypot Protection: silent return if bot filled hidden field
      if (honeypot || b_hp) {
        res.status(201).json({
          success: true,
          message: 'Message sent successfully.',
        });
        return;
      }

      // Sanitize string inputs
      const cleanName = sanitizeInput(name);
      const cleanEmail = sanitizeInput(email).toLowerCase();
      const rawPhone = sanitizeInput(phone);
      const cleanSubject = sanitizeInput(subject);
      const cleanMessage = sanitizeInput(message);

      // 1. Validation
      if (!cleanName) {
        throw new AppError('Name is required.', 400);
      }

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new AppError('A valid email address is required.', 400);
      }

      const digitsOnlyPhone = rawPhone.replace(/^\+91/, '').replace(/[\s-]/g, '');
      if (!digitsOnlyPhone || !/^\d{10}$/.test(digitsOnlyPhone)) {
        throw new AppError('Phone number must be exactly 10 digits.', 400);
      }

      if (!cleanSubject) {
        throw new AppError('Subject is required.', 400);
      }

      if (!cleanMessage || cleanMessage.length < 10) {
        throw new AppError('Message must be at least 10 characters long.', 400);
      }

      // 2. Spam & Rate Limiting Checks
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      // Check 60-second duplicate submission
      const isDuplicate = await contactRepository.checkDuplicate(cleanEmail, cleanMessage, 60);
      if (isDuplicate) {
        throw new AppError('An identical message was recently submitted. Please wait 60 seconds before trying again.', 429);
      }

      // Check IP rate limit (Max 5 per hour)
      if (ipAddress) {
        const recentIpSubmissions = await contactRepository.countRecentByIp(ipAddress, 60);
        if (recentIpSubmissions >= 5) {
          throw new AppError('Too many submissions from your connection. Maximum 5 per hour allowed.', 429);
        }
      }

      // Check Email rate limit (Max 2 per 10 minutes)
      const recentEmailSubmissions = await contactRepository.countRecentByEmail(cleanEmail, 10);
      if (recentEmailSubmissions >= 2) {
        throw new AppError('Too many messages from this email address. Please wait 10 minutes before submitting again.', 429);
      }

      // 3. Store message in Supabase
      const savedMessage = await contactRepository.create({
        name: cleanName,
        email: cleanEmail,
        phone: digitsOnlyPhone,
        subject: cleanSubject,
        message: cleanMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      // 4. Send background email notifications (Admin Alert + Customer Confirmation)
      emailService.sendContactAdminNotification({
        name: cleanName,
        email: cleanEmail,
        phone: digitsOnlyPhone,
        subject: cleanSubject,
        message: cleanMessage,
      }).catch(() => {});

      emailService.sendCustomerContactConfirmation(cleanName, cleanEmail, cleanSubject, cleanMessage).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: {
          id: savedMessage.id,
          created_at: savedMessage.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
