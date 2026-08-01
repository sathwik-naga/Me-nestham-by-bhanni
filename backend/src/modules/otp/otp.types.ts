export type OTPChannel = 'email' | 'phone';

export interface SendEmailOTPPayload {
  email: string;
  userId?: string;
}

export interface VerifyEmailOTPPayload {
  email: string;
  otp: string;
  userId?: string;
}

export interface ResendEmailOTPPayload {
  email: string;
  userId?: string;
}

export interface SendPhoneOTPPayload {
  phone: string;
  userId?: string;
}

export interface VerifyPhoneOTPPayload {
  phone: string;
  otp: string;
  userId?: string;
}

export interface ResendPhoneOTPPayload {
  phone: string;
  userId?: string;
}

export interface OTPRecord {
  id: string;
  user_id?: string | null;
  email?: string | null;
  phone?: string | null;
  otp_hash: string;
  attempts: number;
  resend_count: number;
  expires_at: string;
  is_verified: boolean;
  is_invalidated: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  expiresAt: Date;
  resendCount: number;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  verifiedAt: Date;
}
