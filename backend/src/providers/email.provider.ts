export interface EmailProvider {
  sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<{ messageId?: string | null; error?: string | null }>;
}
