import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { Profile } from '../interfaces/user.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

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
   * Log in user, verify account, and retrieve user profile
   */
  async login(email: string, password: string) {
    logger.info(`Processing login request for: ${email}`);

    // Authenticate with Supabase Auth
    const signInResult = await this.userRepository.signIn(email, password);
    const { user, session } = signInResult;

    if (!user || !session) {
      logger.error('Login succeeded in Supabase Auth but user or session was empty');
      throw new AppError('Authentication failed', 500);
    }

    // Retrieve corresponding profile from profiles table
    let profile = await this.profileRepository.getById(user.id);

    if (!profile) {
      logger.warn(`No profile record found for authenticated user ${user.id}. Creating default profile.`);
      profile = await this.profileRepository.create({
        id: user.id,
        full_name: null,
      });
    }

    const role = (user.app_metadata?.role as 'customer' | 'admin') || 'customer';
    logger.info(`Successful login for user: ${email} (Role: ${role})`);

    return {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
      },
      profile: {
        ...profile,
        email: user.email,
        role, // Include role from Auth JWT app_metadata in response
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
}
