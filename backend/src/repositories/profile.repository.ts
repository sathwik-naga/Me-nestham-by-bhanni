import { supabase, supabaseAdmin } from '../lib/supabase';
import { Profile } from '../interfaces/user.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class ProfileRepository {
  /**
   * Find profile by user ID
   */
  async getById(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`Database error fetching profile by ID ${id}: ${error.message}`);
        throw new AppError('Failed to fetch profile', 500);
      }

      return data as Profile;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching profile by ID ${id}: ${err}`);
      throw new AppError('Internal server error during data retrieval', 500);
    }
  }

  /**
   * Insert new user profile into profiles table (no email column)
   */
  async create(profile: Pick<Profile, 'id' | 'full_name'>): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating profile for ID ${profile.id}: ${error.message}`);
        throw new AppError('Failed to create user profile', 500);
      }

      return data as Profile;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating profile: ${err}`);
      throw new AppError('Internal server error during profile creation', 500);
    }
  }

  /**
   * Update existing user profile in profiles table
   */
  async update(id: string, profile: Partial<Pick<Profile, 'full_name'>>): Promise<Profile> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(profile)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating profile for ID ${id}: ${error.message}`);
        throw new AppError('Failed to update user profile', 500);
      }

      return data as Profile;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating profile for ID ${id}: ${err}`);
      throw new AppError('Internal server error during profile update', 500);
    }
  }
}
