import { EmailRepository, EmailFilterParams, EmailLog } from '../repositories/email.repository';

export class EmailLoggerService {
  constructor(private repository: EmailRepository = new EmailRepository()) {}

  async createLog(data: Omit<EmailLog, 'id' | 'created_at'>) {
    return this.repository.createLog(data);
  }

  async updateStatus(id: string, updates: Partial<EmailLog>) {
    return this.repository.updateStatus(id, updates);
  }

  async checkIdempotency(key: string) {
    return this.repository.checkIdempotency(key);
  }

  async getPaginated(params: EmailFilterParams) {
    return this.repository.getPaginated(params);
  }

  async getDeliveryMetrics() {
    return this.repository.getDeliveryMetrics();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }
}
