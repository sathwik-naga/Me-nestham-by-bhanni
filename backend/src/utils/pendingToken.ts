import crypto from 'crypto';
import env from '../config/env';
import { AppError } from '../middleware/error';

interface Pending2FAPayload {
  userId: string;
  email: string;
  expiresAt: number;
  nonce: string;
}

const TOKEN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'mn_secure_2fa_secret_key_2026';

/**
 * Generate a cryptographically signed, 10-minute expiring pending_2fa token
 */
export function createPending2FAToken(userId: string, email: string): string {
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  const payload: Pending2FAPayload = {
    userId,
    email: email.toLowerCase().trim(),
    expiresAt: Date.now() + TEN_MINUTES_MS,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode a pending_2fa token
 */
export function verifyPending2FAToken(token: string): Pending2FAPayload {
  if (!token || !token.includes('.')) {
    throw new AppError('Invalid or missing 2FA session ticket.', 400);
  }

  const [payloadEncoded, signature] = token.split('.');

  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new AppError('2FA session ticket has been tampered with or is invalid.', 400);
  }

  let payload: Pending2FAPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
  } catch (e) {
    throw new AppError('Malformed 2FA session ticket payload.', 400);
  }

  if (Date.now() > payload.expiresAt) {
    throw new AppError('2FA session ticket has expired. Please log in again.', 400);
  }

  return payload;
}
