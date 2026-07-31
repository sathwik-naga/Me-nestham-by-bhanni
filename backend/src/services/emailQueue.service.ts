import { EmailProvider } from '../providers/email.provider';
import { EmailRepository } from '../repositories/email.repository';
import { supabaseAdmin } from '../lib/supabase';
import logger from '../utils/logger';

export interface EmailJob {
  logId: string;
  recipient: string;
  subject: string;
  html: string;
  template: string;
  idempotencyKey?: string;
  orderId?: string;
  attempts?: number;
}

export class EmailQueueService {
  private queue: EmailJob[] = [];
  private isProcessing = false;

  constructor(
    private provider: EmailProvider,
    private repository: EmailRepository
  ) {}

  /**
   * Enqueue a new email job
   */
  async addJob(job: EmailJob): Promise<void> {
    this.queue.push({ ...job, attempts: job.attempts || 0 });
    logger.info(`Email job enqueued for ${job.recipient} (Template: ${job.template}, LogId: ${job.logId})`);
    
    // Process queue asynchronously without blocking main thread
    this.processQueue();
  }

  /**
   * Asynchronously process jobs in queue
   */
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

  /**
   * Detect if an error is transient (retryable) vs permanent
   */
  private isTransientError(errorMessage: string): boolean {
    if (!errorMessage) return false;
    const lower = errorMessage.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('timeout') || lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('504') || lower.includes('network')) {
      return true;
    }
    return false;
  }

  /**
   * Execute email delivery job with 3-attempt exponential backoff
   */
  private async executeJob(job: EmailJob): Promise<void> {
    const currentAttempt = (job.attempts || 0) + 1;
    logger.info(`Executing email job (Attempt ${currentAttempt}/3) for: ${job.recipient} (Template: ${job.template})`);

    // Update status to processing
    await this.repository.updateStatus(job.logId, {
      status: 'processing',
      attempts: currentAttempt,
    });

    const result = await this.provider.sendEmail(job.recipient, job.subject, job.html);

    if (result.error) {
      const isRetryable = this.isTransientError(result.error);
      logger.warn(`Email delivery attempt ${currentAttempt} failed for ${job.recipient}. Error: ${result.error}`);

      const retryDelaysSeconds = (process.env.EMAIL_RETRY_DELAYS || '2,6,30')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const maxAttempts = retryDelaysSeconds.length;
      const delaySec = retryDelaysSeconds[Math.min(currentAttempt - 1, maxAttempts - 1)] || 2;
      const backoffMs = delaySec * 1000;

      if (currentAttempt < maxAttempts && isRetryable) {
        logger.info(`Scheduling retry #${currentAttempt} in ${backoffMs}ms for log ID: ${job.logId}`);

        await this.repository.updateStatus(job.logId, {
          status: 'queued',
          error_message: result.error,
          is_retryable: true,
        });

        // Delay retry using setTimeout before pushing back to queue
        setTimeout(() => {
          this.queue.push({
            ...job,
            attempts: currentAttempt,
          });
          this.processQueue();
        }, backoffMs);
      } else {
        // Permanent failure or max attempts reached
        logger.error(`Permanent failure for email log ID ${job.logId} after ${currentAttempt} attempts.`);
        await this.repository.updateStatus(job.logId, {
          status: 'failed',
          error_message: result.error,
          is_retryable: isRetryable,
        });
      }
    } else {
      // Successful delivery
      logger.info(`Email delivered successfully to ${job.recipient}. Provider Message ID: ${result.messageId}`);
      await this.repository.updateStatus(job.logId, {
        status: 'sent',
        provider_message_id: result.messageId,
        error_message: null,
      });

      // Record email sent event in order timeline if orderId is attached
      if (job.orderId) {
        await this.recordOrderTimeline(job.orderId, job.template, job.subject);
      }
    }
  }

  /**
   * Helper to record email dispatch events in order timeline history
   */
  private async recordOrderTimeline(orderId: string, template: string, subject: string): Promise<void> {
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('timeline, history')
        .eq('id', orderId)
        .single();

      if (order) {
        const existingTimeline = order.timeline || order.history || [];
        const newEvent = {
          event: `Email Sent: ${template}`,
          description: subject,
          timestamp: new Date().toISOString(),
        };

        await supabaseAdmin
          .from('orders')
          .update({
            timeline: [...existingTimeline, newEvent],
            history: [...existingTimeline, newEvent],
          })
          .eq('id', orderId);
      }
    } catch (err) {
      logger.warn(`Failed to update order timeline for email ${template}: ${err}`);
    }
  }
}
