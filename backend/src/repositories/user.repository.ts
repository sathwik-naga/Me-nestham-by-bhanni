import { supabase } from '../lib/supabase';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class UserRepository {
  /**
   * Register a new user in Supabase Auth
   */
  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.error(`Supabase Auth signUp failed for ${email}: ${error.message}`);
        throw new AppError(error.message, error.status || 400);
      }

      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error during user sign up: ${err}`);
      throw new AppError('Internal authentication error during registration', 500);
    }
  }

  /**
   * Login user with email and password in Supabase Auth
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.warn(`Failed login attempt for ${email}: ${error.message}`);
        throw new AppError(error.message, error.status || 400);
      }

      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error during user sign in: ${err}`);
      throw new AppError('Internal authentication error during login', 500);
    }
  }

  /**
   * Log out the current user session by setting the session and invoking signOut
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      if (sessionError) {
        logger.warn(`Failed to set session for logout (might already be logged out): ${sessionError.message}`);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn(`Supabase Auth signOut failed (might already be logged out): ${error.message}`);
        return;
      }
    } catch (err) {
      logger.warn(`Unexpected error during user sign out (idempotent): ${err}`);
    }
  }

  /**
   * Retrieve user info from active access token
   */
  async getUserByToken(accessToken: string) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        logger.warn(`Failed to retrieve user by token: ${error?.message || 'No user found'}`);
        return null;
      }
      return user;
    } catch (err) {
      logger.error(`Unexpected error during getUserByToken: ${err}`);
      return null;
    }
  }
}
