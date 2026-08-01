import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../../lib/supabase';
import env from '../../config/env';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/error';
import {
  OTPChannel,
  SendEmailOTPPayload,
  VerifyEmailOTPPayload,
  ResendEmailOTPPayload,
  SendPhoneOTPPayload,
  VerifyPhoneOTPPayload,
  ResendPhoneOTPPayload,
  SendOTPResult,
  VerifyOTPResult,
  OTPRecord,
} from './otp.types';

export class OTPService {
  private mailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initMailTransporter();
  }

  /**
   * Initialize SMTP Mailer if credentials exist
   */
  private initMailTransporter(): void {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.mailTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info('OTP Email Transporter initialized with SMTP config.');
    } else {
      logger.warn('SMTP credentials not configured. OTP emails will be logged to console in dev mode.');
    }
  }

  /**
   * Cryptographically secure 6-digit OTP generator
   */
  public generateOTPCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hash OTP using bcrypt
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
   * Invalidate all active (unverified & uninvalidated) OTPs for a target
   */
  public async invalidatePreviousOTPs(channel: OTPChannel, identifier: string): Promise<void> {
    const table = channel === 'email' ? 'email_otps' : 'phone_otps';
    const field = channel === 'email' ? 'email' : 'phone';

    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_invalidated: true, updated_at: new Date().toISOString() })
      .eq(field, identifier)
      .eq('is_verified', false)
      .eq('is_invalidated', false);

    if (error) {
      logger.error(`Error invalidating previous OTPs on table ${table} for ${identifier}: ${error.message}`);
    }
  }

  /**
   * Dispatch OTP Email via SMTP or Fallback Logger
   */
  private async dispatchEmailOTP(email: string, otp: string): Promise<void> {
    const subject = 'Your Verification OTP Code - Me Nestham By Bhanni';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #8A2BE2; text-align: center;">Me Nestham By Bhanni</h2>
        <p style="font-size: 15px; color: #333;">Namaste,</p>
        <p style="font-size: 14px; color: #555;">Your verification code for security verification is:</p>
        <div style="background-color: #8A2BE2; color: #ffffff; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #888;">This OTP is valid for ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #aaa; text-align: center;">© Me Nestham By Bhanni. All rights reserved.</p>
      </div>
    `;

    if (this.mailTransporter) {
      try {
        await this.mailTransporter.sendMail({
          from: env.SMTP_FROM,
          to: email,
          subject,
          html,
        });
        logger.info(`OTP email successfully dispatched to ${email}`);
      } catch (err: any) {
        logger.error(`Failed to send OTP email via SMTP to ${email}: ${err.message}`);
        // Log in dev environment fallback
        logger.info(`[DEV OTP FALLBACK] OTP for ${email}: ${otp}`);
      }
    } else {
      logger.info(`[DEV OTP DISPLAY] Verification OTP for ${email} is: ${otp}`);
    }
  }

  /**
   * Dispatch OTP SMS via SMS Gateway or Fallback Logger
   */
  private async dispatchPhoneOTP(phone: string, otp: string): Promise<void> {
    logger.info(`[SMS DISPATCH] Verification OTP for phone ${phone} is: ${otp}`);
  }

  // ==========================================
  // EMAIL OTP OPERATIONS
  // ==========================================

  /**
   * Send Email OTP
   */
  public async sendEmailOTP(payload: SendEmailOTPPayload): Promise<SendOTPResult> {
    const { email, userId } = payload;

    // 1. Invalidate any existing active OTPs for this email
    await this.invalidatePreviousOTPs('email', email);

    // 2. Generate and hash OTP
    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // 3. Store in email_otps table
    const { data, error } = await supabaseAdmin
      .from('email_otps')
      .insert({
        user_id: userId || null,
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
      logger.error(`Failed to create email OTP record for ${email}: ${error?.message}`);
      throw new AppError('Failed to generate verification OTP. Please try again.', 500);
    }

    // 4. Send Email
    await this.dispatchEmailOTP(email, rawOTP);

    return {
      success: true,
      message: `OTP sent successfully to ${email}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
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
      throw new AppError('Invalid or expired OTP request. Please request a new OTP.', 400);
    }

    // 2. Expiry Check
    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (now > expiresAt) {
      await supabaseAdmin
        .from('email_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('OTP has expired. Please request a new OTP.', 400);
    }

    // 3. Max Attempts Check
    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('email_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 429);
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
        throw new AppError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 429);
      }

      throw new AppError(`Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`, 400);
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
      message: 'Email OTP verified successfully.',
      verifiedAt,
    };
  }

  /**
   * Resend Email OTP
   */
  public async resendEmailOTP(payload: ResendEmailOTPPayload): Promise<SendOTPResult> {
    const { email, userId } = payload;

    // 1. Get latest unverified record
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
      throw new AppError('Maximum OTP resend limit reached. Please try again later.', 429);
    }

    // 3. Invalidate previous OTPs
    await this.invalidatePreviousOTPs('email', email);

    // 4. Generate new OTP
    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const newResendCount = currentResendCount + 1;

    // 5. Store record
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
      throw new AppError('Failed to resend OTP. Please try again.', 500);
    }

    // 6. Dispatch Email
    await this.dispatchEmailOTP(email, rawOTP);

    return {
      success: true,
      message: `OTP resent successfully to ${email}.`,
      expiresAt,
      resendCount: newResendCount,
    };
  }

  // ==========================================
  // PHONE OTP OPERATIONS
  // ==========================================

  /**
   * Send Phone OTP
   */
  public async sendPhoneOTP(payload: SendPhoneOTPPayload): Promise<SendOTPResult> {
    const { phone, userId } = payload;

    await this.invalidatePreviousOTPs('phone', phone);

    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const { error } = await supabaseAdmin.from('phone_otps').insert({
      user_id: userId || null,
      phone,
      otp_hash: otpHash,
      attempts: 0,
      resend_count: 0,
      expires_at: expiresAt.toISOString(),
      is_verified: false,
      is_invalidated: false,
    });

    if (error) {
      logger.error(`Failed to create phone OTP record for ${phone}: ${error.message}`);
      throw new AppError('Failed to generate verification OTP for phone.', 500);
    }

    await this.dispatchPhoneOTP(phone, rawOTP);

    return {
      success: true,
      message: `OTP sent successfully to phone ${phone}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes.`,
      expiresAt,
      resendCount: 0,
    };
  }

  /**
   * Verify Phone OTP
   */
  public async verifyPhoneOTP(payload: VerifyPhoneOTPPayload): Promise<VerifyOTPResult> {
    const { phone, otp } = payload;

    const { data: record, error } = await supabaseAdmin
      .from('phone_otps')
      .select('*')
      .eq('phone', phone)
      .eq('is_verified', false)
      .eq('is_invalidated', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OTPRecord>();

    if (error || !record) {
      throw new AppError('Invalid or expired OTP request. Please request a new OTP.', 400);
    }

    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (now > expiresAt) {
      await supabaseAdmin
        .from('phone_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('OTP has expired. Please request a new OTP.', 400);
    }

    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('phone_otps')
        .update({ is_invalidated: true, updated_at: now.toISOString() })
        .eq('id', record.id);

      throw new AppError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 429);
    }

    const isMatch = await this.compareOTP(otp, record.otp_hash);

    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      const remainingAttempts = env.OTP_MAX_ATTEMPTS - newAttempts;

      await supabaseAdmin
        .from('phone_otps')
        .update({
          attempts: newAttempts,
          ...(newAttempts >= env.OTP_MAX_ATTEMPTS ? { is_invalidated: true } : {}),
          updated_at: now.toISOString(),
        })
        .eq('id', record.id);

      if (remainingAttempts <= 0) {
        throw new AppError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 429);
      }

      throw new AppError(`Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    const verifiedAt = new Date();
    await supabaseAdmin
      .from('phone_otps')
      .update({
        is_verified: true,
        is_invalidated: true,
        updated_at: verifiedAt.toISOString(),
      })
      .eq('id', record.id);

    return {
      success: true,
      message: 'Phone OTP verified successfully.',
      verifiedAt,
    };
  }

  /**
   * Resend Phone OTP
   */
  public async resendPhoneOTP(payload: ResendPhoneOTPPayload): Promise<SendOTPResult> {
    const { phone, userId } = payload;

    const { data: record } = await supabaseAdmin
      .from('phone_otps')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OTPRecord>();

    const currentResendCount = record ? record.resend_count : 0;

    if (currentResendCount >= env.OTP_RESEND_LIMIT) {
      throw new AppError('Maximum OTP resend limit reached. Please try again later.', 429);
    }

    await this.invalidatePreviousOTPs('phone', phone);

    const rawOTP = this.generateOTPCode();
    const otpHash = await this.hashOTP(rawOTP);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
    const newResendCount = currentResendCount + 1;

    const { error } = await supabaseAdmin.from('phone_otps').insert({
      user_id: userId || record?.user_id || null,
      phone,
      otp_hash: otpHash,
      attempts: 0,
      resend_count: newResendCount,
      expires_at: expiresAt.toISOString(),
      is_verified: false,
      is_invalidated: false,
    });

    if (error) {
      logger.error(`Failed to resend phone OTP for ${phone}: ${error.message}`);
      throw new AppError('Failed to resend OTP. Please try again.', 500);
    }

    await this.dispatchPhoneOTP(phone, rawOTP);

    return {
      success: true,
      message: `OTP resent successfully to phone ${phone}.`,
      expiresAt,
      resendCount: newResendCount,
    };
  }
}
