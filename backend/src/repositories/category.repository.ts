import { supabase, supabaseAdmin } from '../lib/supabase';
import { Category } from '../interfaces/product.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class CategoryRepository {
  /**
   * Fetch all categories
   */
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error(`Database error fetching categories: ${error.message}`);
        throw new AppError('Failed to fetch categories', 500);
      }

      return data as Category[];
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching categories: ${err}`);
      throw new AppError('Internal server error during data retrieval', 500);
    }
  }

  /**
   * Fetch category by ID
   */
  async getById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching category by ID ${id}: ${error.message}`);
        throw new AppError('Failed to fetch category', 500);
      }

      return data as Category;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching category by ID ${id}: ${err}`);
      throw new AppError('Internal server error during data retrieval', 500);
    }
  }

  /**
   * Fetch category by Slug
   */
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching category by slug ${slug}: ${error.message}`);
        throw new AppError('Failed to fetch category', 500);
      }

      return data as Category;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching category by slug: ${err}`);
      throw new AppError('Internal server error during data retrieval', 500);
    }
  }

  /**
   * Create a new category
   */
  async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating category: ${error.message}`);
        throw new AppError('Failed to create category', 500);
      }

      return data as Category;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating category: ${err}`);
      throw new AppError('Internal server error during category creation', 500);
    }
  }

  /**
   * Update category by ID
   */
  async update(id: string, category: Partial<Omit<Category, 'id' | 'created_at'>>): Promise<Category> {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating category ${id}: ${error.message}`);
        throw new AppError('Failed to update category', 500);
      }

      return data as Category;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating category ${id}: ${err}`);
      throw new AppError('Internal server error during category update', 500);
    }
  }

  /**
   * Delete category by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Database error deleting category ${id}: ${error.message}`);
        throw new AppError('Failed to delete category', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleting category ${id}: ${err}`);
      throw new AppError('Internal server error during category removal', 500);
    }
  }
}
