import { EmailProvider } from './email.provider';
import { EmailRepository } from '../repositories/email.repository';
import logger from '../utils/logger';

export interface EmailJob {
  logId: string;
  recipient: string;
  subject: string;
  html: string;
  template: string;
}

export class InMemoryEmailQueue {
  private queue: EmailJob[] = [];
  private isProcessing = false;

  constructor(
    private provider: EmailProvider,
    private repository: EmailRepository
  ) {}

  async addJob(job: EmailJob): Promise<void> {
    this.queue.push(job);
    logger.info(`Email job enqueued for ${job.recipient} (Template: ${job.template}, LogId: ${job.logId})`);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    setImmediate(async () => {
      try {
        while (this.queue.length > 0) {
          const job = this.queue.shift();
          if (!job) continue;

          try {
            await this.executeJob(job);
          } catch (err) {
            logger.error(`Exception processing email queue job: ${err}`);
          }
        }
      } finally {
        this.isProcessing = false;
      }
    });
  }

  private async executeJob(job: EmailJob): Promise<void> {
    logger.info(`Dispatching email job for: ${job.recipient} (Template: ${job.template})`);
    
    await this.repository.updateStatus(job.logId, { status: 'processing' });
    const result = await this.provider.sendEmail(job.recipient, job.subject, job.html);
    
    if (result.error) {
      logger.warn(`Email delivery failed for ${job.recipient}. Error: ${result.error}`);
      
      const log = await this.repository.getById(job.logId);
      const currentAttempts = log ? log.attempts : 0;

      if (currentAttempts < 3) {
        logger.info(`Triggering retry for failed log ID: ${job.logId}`);
        await this.repository.updateStatus(job.logId, {
          status: 'queued',
          attempts: currentAttempts + 1,
          error_message: result.error,
        });
        
        this.queue.push(job);
      } else {
        await this.repository.updateStatus(job.logId, {
          status: 'failed',
          attempts: currentAttempts + 1,
          error_message: result.error,
        });
      }
    } else {
      logger.info(`Email delivered successfully to ${job.recipient}. Message ID: ${result.messageId}`);
      await this.repository.updateStatus(job.logId, {
        status: 'sent',
        provider_message_id: result.messageId,
        error_message: null,
      });
    }
  }
}
