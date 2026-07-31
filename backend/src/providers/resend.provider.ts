import { Resend } from 'resend';
import { EmailProvider } from './email.provider';
import logger from '../utils/logger';

export class ResendProvider implements EmailProvider {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      logger.warn('Resend provider initialized without RESEND_API_KEY. Mails will fail if sent.');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<{ messageId?: string | null; error?: string | null }> {
    if (!this.resend) {
      return { error: 'Resend API key is unconfigured' };
    }

    const from = process.env.EMAIL_FROM || 'Me Nestham <orders@yourdomain.com>';

    try {
      const response = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (response.error) {
        logger.error(`Resend email delivery failed: ${response.error.message}`);
        return { error: response.error.message };
      }

      return { messageId: response.data?.id || null };
    } catch (err: any) {
      logger.error(`Resend provider connection exception: ${err?.message || err}`);
      return { error: err?.message || 'Connection failure' };
    }
  }
}
