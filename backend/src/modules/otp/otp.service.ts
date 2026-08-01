import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../lib/supabase';
import env from '../../config/env';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/error';
import {
  SendEmailOTPPayload,
  VerifyEmailOTPPayload,
  ResendEmailOTPPayload,
  SendOTPResult,
  VerifyOTPResult,
  OTPRecord,
} from './otp.types';

export class OTPService {
  private mailTransporter: nodemailer.Transporter | null = null;
  private resendClient: Resend | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initEmailTransports();
    this.startScheduledCleanup();
  }

  /**
   * Initialize Transactional Email Providers: Resend (Primary) -> SMTP (Fallback) -> Logger (Dev)
   */
  private initEmailTransports(): void {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== 're_your_api_key') {
      this.resendClient = new Resend(resendKey);
      logger.info('OTP Transactional Email Service initialized with Resend API Provider.');
    } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.mailTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info('OTP Transactional Email Service initialized with SMTP Mailer.');
    } else {
      logger.warn('No Resend API Key or SMTP credentials configured. OTP emails will log to console in dev mode.');
    }
  }

  /**
   * Automatic background cleanup job running every 6 hours
   */
  private startScheduledCleanup(): void {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredOTPs().catch((err) => {
        logger.error(`Automated OTP cleanup background job error: ${err.message}`);
      });
    }, SIX_HOURS);
  }

  /**
   * Clean up expired OTPs and verified OTP records older than 24 hours
   */
  public async cleanupExpiredOTPs(): Promise<number> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Delete expired unverified records older than 1 hour or verified records older than 24 hours
      const { data, error } = await supabaseAdmin
        .from('email_otps')
        .delete()
        .or(`expires_at.lt.${oneHourAgo},and(is_verified.eq.true,updated_at.lt.${twentyFourHoursAgo})`)
        .select('id');

      if (error) {
        logger.error(`Error cleaning up expired email OTP records: ${error.message}`);
        return 0;
      }

      const deletedCount = data ? data.length : 0;
      if (deletedCount > 0) {
        logger.info(`Automated OTP Cleanup: Cleaned ${deletedCount} stale/expired OTP records.`);
      }
      return deletedCount;
    } catch (err: any) {
      logger.error(`Cleanup OTP exception: ${err.message}`);
      return 0;
    }
  }

  /**
   * Cryptographically secure 6-digit OTP generator
   */
  public generateOTPCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hash OTP using bcrypt with salt rounds = 10
   */
  public async hashOTP(otp: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(otp, saltRounds);
  }

  /**
   * Compare plain OTP with hashed bcrypt value
   */
  public async compareOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
    return bcrypt.compare(plainOTP, hashedOTP);
  }

  /**
   * Invalidate all active (unverified & uninvalidated) OTPs for an email address
   */
  public async invalidatePreviousOTPs(email: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('email_otps')
      .update({ is_invalidated: true, updated_at: new Date().toISOString() })
      .eq('email', email)
      .eq('is_verified', false)
      .eq('is_invalidated', false);

    if (error) {
      logger.error(`Error invalidating previous email OTPs for ${email}: ${error.message}`);
    }
  }

  /**
   * Dispatch OTP Email using Resend (Production) -> SMTP (Fallback) -> Console (Dev)
   */
  private async dispatchEmailOTP(email: string, otp: string): Promise<void> {
    const fromEmail = process.env.EMAIL_FROM || env.SMTP_FROM || 'Me Nestham By Bhanni <noreply@menesthambybhanni.com>';
    const subject = 'Your 2FA Verification Code - Me Nestham By Bhanni';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #8A2BE2; margin: 0; font-size: 22px;">Me Nestham By Bhanni</h2>
          <span style="font-size: 11px; text-transform: uppercase; tracking: 2px; color: #6b7280;">Second-Factor Authentication</span>
        </div>
        <p style="font-size: 14px; color: #374151;">Namaste,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">Your one-time passcode for secondary login verification is:</p>
        <div style="background: linear-gradient(135deg, #8A2BE2 0%, #4B0082 100%); color: #ffffff; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 18px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 12px rgba(138, 43, 226, 0.2);">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire in <strong>${env.OTP_EXPIRY_MINUTES} minutes</strong>. If you did not initiate this login attempt, please secure your account immediately.</p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">© Me Nestham By Bhanni Luxury Handcrafts. All rights reserved.</p>
      </div>
    `;

    // 1. Try Resend API first (Production Grade Transactional Mailer)
    if (this.resendClient) {
      try {
        await this.resendClient.emails.send({
          from: fromEmail,
          to: [email],
          subject,
          html,
        });
        logger.info(`OTP 2FA email successfully delivered via Resend API to ${email}`);
        return;
      } catch (err: any) {
        logger.error(`Resend API delivery failed for ${email}: ${err.message}. Falling back to secondary transport.`);
      }
    }

    // 2. Try SMTP Mailer fallback
    if (this.mailTransporter) {
      try {
        await this.mailTransporter.sendMail({
          from: fromEmail,
          to: email,
          subject,
          html,
        });
        logger.info(`OTP 2FA email successfully delivered via SMTP to ${email}`);
        return;
      } catch (err: any) {
        logger.error(`SMTP delivery failed for ${email}: ${err.message}`);
      }
    }

    // 3. Dev Mode Fallback Logger
    logger.info(`[DEV 2FA OTP DISPLAY] Passcode for ${email} is: ${otp}`);
  }

  /**
   * Verify primary authentication state for user before issuing 2FA OTP
   */
  private async verifyUserExists(email: string): Promise<string | null> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      return profile ? profile.id : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Send Email OTP (Gated / Pre-authenticated Primary Step)
   */
  public async sendEmailOTP(payload: SendEmailOTPPayload): Promise<SendOTPResult> {
    const { email } = payload;

    // 1. Verify user exists in primary database (Pre-authentication check)
    const userId = payload.userId || (await this.verifyUserExists(email));
    if (!userId) {
      // Return ambiguous response for security to prevent user enumeration attacks
      logger.warn(`OTP request rejected: Email ${email} not registered in primary auth database.`);
      return {
        success: true,
        message: `If an account exists for ${email}, a 2FA verification code has been dispatched.`,
        expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
        resendCount: 0,
      };
    }

    // 2. Invalidate any existing active OTPs for this email
    await this.invalidatePreviousOTPs(email);

    // 3. Generate & hash OTP
    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Store in email_otps table
    const { data, error } = await supabaseAdmin
      .from('email_otps')
      .insert({
        user_id: userId,
        email,
        otp_hash: otpHash,
        attempts: 0,
        resend_count: 0,
        expires_at: expiresAt.toISOString(),
        is_verified: false,
        is_invalidated: false,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error(`Failed to insert email OTP record for ${email}: ${error?.message}`);
      throw new AppError('Failed to generate 2FA verification code. Please try again.', 500);
    }

    // 5. Send Transactional Email
    await this.dispatchEmailOTP(email, rawOTP);

    return {
      success: true,
      message: `2FA verification code dispatched to ${email}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
      expiresAt,
      resendCount: 0,
    };
  }

  /**
   * Verify Email OTP
   */
  public async verifyEmailOTP(payload: VerifyEmailOTPPayload): Promise<VerifyOTPResult> {
    const { email, otp } = payload;

    // 1. Get latest uninvalidated and unverified OTP record
    const { data: record, error } = await supabaseAdmin
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('is_verified', false)
      .eq('is_invalidated', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OTPRecord>();

    if (error || !record) {
      throw new AppError('Invalid or expired 2FA OTP request. Please request a new code.', 400);
    }

    // 2. Expiry Check
    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (now > expiresAt) {
      await supabaseAdmin
        .from('email_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('2FA OTP code has expired. Please request a new code.', 400);
    }

    // 3. Max Attempts Check
    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('email_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('Maximum OTP verification attempts exceeded. Please request a new code.', 429);
    }

    // 4. Compare OTP
    const isMatch = await this.compareOTP(otp, record.otp_hash);

    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      const remainingAttempts = env.OTP_MAX_ATTEMPTS - newAttempts;

      await supabaseAdmin
        .from('email_otps')
        .update({
          attempts: newAttempts,
          ...(newAttempts >= env.OTP_MAX_ATTEMPTS ? { is_invalidated: true } : {}),
          updated_at: now.toISOString(),
        })
        .eq('id', record.id);

      if (remainingAttempts <= 0) {
        throw new AppError('Maximum 2FA verification attempts exceeded. Please request a new code.', 429);
      }

      throw new AppError(`Invalid 2FA verification code. ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    // 5. Success -> Mark verified & invalidated
    const verifiedAt = new Date();
    await supabaseAdmin
      .from('email_otps')
      .update({
        is_verified: true,
        is_invalidated: true,
        updated_at: verifiedAt.toISOString(),
      })
      .eq('id', record.id);

    return {
      success: true,
      message: '2FA Email OTP verified successfully.',
      verifiedAt,
    };
  }

  /**
   * Resend Email OTP
   */
  public async resendEmailOTP(payload: ResendEmailOTPPayload): Promise<SendOTPResult> {
    const { email, userId } = payload;

    // 1. Fetch latest record to inspect resend count
    const { data: record } = await supabaseAdmin
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OTPRecord>();

    const currentResendCount = record ? record.resend_count : 0;

    // 2. Check Resend Limit
    if (currentResendCount >= env.OTP_RESEND_LIMIT) {
      throw new AppError('Maximum OTP resend limit reached for this session. Please try again later.', 429);
    }

    // 3. Invalidate previous active OTPs
    await this.invalidatePreviousOTPs(email);

    // 4. Generate new OTP
    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const newResendCount = currentResendCount + 1;

    // 5. Insert new record
    const { error } = await supabaseAdmin.from('email_otps').insert({
      user_id: userId || record?.user_id || null,
      email,
      otp_hash: otpHash,
      attempts: 0,
      resend_count: newResendCount,
      expires_at: expiresAt.toISOString(),
      is_verified: false,
      is_invalidated: false,
    });

    if (error) {
      logger.error(`Failed to resend email OTP for ${email}: ${error.message}`);
      throw new AppError('Failed to resend 2FA verification code. Please try again.', 500);
    }

    // 6. Dispatch Email
    await this.dispatchEmailOTP(email, rawOTP);

    return {
      success: true,
      message: `2FA verification code resent successfully to ${email}.`,
      expiresAt,
      resendCount: newResendCount,
    };
  }
}
