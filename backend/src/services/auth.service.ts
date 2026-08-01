import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { Profile } from '../interfaces/user.interface';
import { AppError } from '../middleware/error';
import { supabaseAdmin } from '../lib/supabase';
import { EmailService } from './email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import { createPending2FAToken, verifyPending2FAToken } from '../utils/pendingToken';
import { OTPService } from '../modules/otp/otp.service';
import logger from '../utils/logger';

const emailService = new EmailService(new EmailRepository(), new ResendProvider());
const otpService = new OTPService();

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private profileRepository: ProfileRepository
  ) {}

  /**
   * Register a new user and create their profile
   */
  async register(email: string, password: string, fullName?: string) {
    logger.info(`Processing registration request for: ${email}`);

    // Sign up the user in Supabase Auth (Supabase Auth automatically checks email uniqueness)
    const signUpResult = await this.userRepository.signUp(email, password);
    const { user, session } = signUpResult;

    if (!user) {
      logger.error('Registration succeeded in Supabase Auth but user object was not returned');
      throw new AppError('Registration failed during account creation', 500);
    }

    // Fetch automatically created profile
    let profile = await this.profileRepository.getById(user.id);

    if (!profile) {
      logger.error(`Registration succeeded but automatic profile creation failed for user ID ${user.id}`);
      throw new AppError('Account registered but profile trigger failed to initialize', 500);
    }

    // If full_name is provided, update the existing profile
    if (fullName) {
      profile = await this.profileRepository.update(user.id, { full_name: fullName });
      logger.info(`Profile updated successfully with full_name for user ID ${user.id}`);
    } else {
      logger.info(`Profile fetched successfully (created via trigger) for user ID ${user.id}`);
    }
    // Send welcome email (asynchronous queue)
    emailService.sendWelcomeEmail(email, fullName || 'Customer').catch((err) => {
      logger.error(`Failed to trigger welcome email on registration: ${err}`);
    });

    return {
      session: session || null,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    };
  }

  /**
   * Log in user - Step 1: Verify primary credentials and issue pending 2FA token
   */
  async login(email: string, password: string) {
    logger.info(`Processing primary login request for: ${email}`);

    // 1. Authenticate primary credentials with Supabase Auth
    const signInResult = await this.userRepository.signIn(email, password);
    const { user } = signInResult;

    if (!user || !user.email) {
      logger.error('Login succeeded in Supabase Auth but user object was empty');
      throw new AppError('Authentication failed', 500);
    }

    // 2. Retrieve corresponding profile from profiles table
    let profile = await this.profileRepository.getById(user.id);
    if (!profile) {
      logger.warn(`No profile record found for authenticated user ${user.id}. Creating default profile.`);
      profile = await this.profileRepository.create({
        id: user.id,
        full_name: null,
      });
    }

    // 3. Issue cryptographically signed 10-minute pending_2fa token
    const pendingToken = createPending2FAToken(user.id, user.email);

    // 4. Dispatch Email OTP for 2FA
    await otpService.sendEmailOTP({ email: user.email, userId: user.id });

    logger.info(`Primary credentials verified for ${email}. Issued pending_2fa ticket.`);

    return {
      require2FA: true,
      status: 'pending_2fa',
      pendingToken,
      email: user.email,
      message: 'Primary credentials verified. Please enter the 2FA code sent to your email.',
    };
  }

  /**
   * Log in user - Step 2: Complete 2FA OTP verification and issue full application session
   */
  async verify2FALogin(pendingToken: string, otp: string) {
    // 1. Verify pendingToken signature & expiry
    const payload = verifyPending2FAToken(pendingToken);

    // 2. Verify Email OTP code
    await otpService.verifyEmailOTP({ email: payload.email, otp });

    // 3. Fetch user profile
    let profile = await this.profileRepository.getById(payload.userId);
    if (!profile) {
      profile = await this.profileRepository.create({ id: payload.userId, full_name: null });
    }

    const role = profile.role || 'customer';
    logger.info(`2FA completed successfully for user: ${payload.email} (Role: ${role})`);

    // 4. Generate admin session or user session token
    const { data: userAdminData } = await supabaseAdmin.auth.admin.getUserById(payload.userId);
    const user = userAdminData.user;

    // Issue custom session object
    return {
      session: {
        access_token: pendingToken, // Or active Supabase access token
        expires_in: 3600 * 24,
      },
      user: {
        id: payload.userId,
        email: payload.email,
        role,
      },
      profile: {
        ...profile,
        email: payload.email,
        role,
      },
    };
  }

  /**
   * Terminate user session
   */
  async logout(accessToken: string): Promise<void> {
    logger.info('Processing logout request');
    await this.userRepository.signOut(accessToken);
    logger.info('User session revoked successfully');
  }

  /**
   * Fetch profile for current authenticated user
   */
  async getCurrentProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.getById(userId);
    if (!profile) {
      logger.error(`Current user ID ${userId} has no profiles row`);
      throw new AppError('User profile not found', 404);
    }
    return profile;
  }

  /**
   * Handle forgot password recovery link generation and email enqueuing
   */
  async forgotPassword(email: string): Promise<void> {
    logger.info(`Password reset requested for: ${email}`);
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password`
        }
      });

      if (!error && data?.properties?.action_link) {
        const actionLink = data.properties.action_link;
        await emailService.sendPasswordResetEmail(email, actionLink);
        logger.info(`Reset link generated and emailed to ${email}`);
      } else {
        logger.warn(`Suppressed forgot password error to avoid enumeration: ${error?.message || 'No action link'}`);
      }
    } catch (err) {
      logger.error(`Unexpected forgot password error: ${err}`);
    }
  }

  /**
   * Reset user password (expects authenticated session established by recovery token)
   */
  async resetPassword(userId: string, password: string): Promise<void> {
    logger.info(`Resetting password for user ID: ${userId}`);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password
    });

    if (error) {
      logger.error(`Supabase password reset failed: ${error.message}`);
      throw new AppError(error.message, 400);
    }
    logger.info(`Password successfully reset for user ID: ${userId}`);
  }
}
