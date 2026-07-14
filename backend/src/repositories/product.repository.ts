import { supabase, supabaseAdmin } from '../lib/supabase';
import { Product, ProductFilters, ProductImage, ProductVariant } from '../interfaces/product.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class ProductRepository {
  /**
   * Helper to format raw product output from database
   */
  private formatProduct(product: Record<string, unknown>): Product {
    const images = (product.images as { image_url: string; is_featured: boolean }[] | undefined) || [];
    const featured = images.find((img) => img.is_featured);
    const mainImageUrl = product.image_url as string | null;
    
    return {
      ...product,
      featured_image: mainImageUrl || (featured ? featured.image_url : (images[0]?.image_url || null)),
      gallery_images: [
        ...(mainImageUrl ? [mainImageUrl] : []),
        ...images.map((img) => img.image_url)
      ],
    } as unknown as Product;
  }

  /**
   * Query filtered and paginated products
   */
  async getProducts(filters: ProductFilters): Promise<{ products: Product[]; count: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Construct base query joining relations
      let query = supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
          `,
          { count: 'exact' }
        );

      // Default: only fetch active products
      query = query.eq('is_active', true);

      // Apply category filter
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Apply price range filter
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      // Apply featured filter (using "featured" column)
      if (filters.isFeatured !== undefined) {
        query = query.eq('featured', filters.isFeatured);
      }

      // Apply bestseller filter (using "bestseller" column)
      if (filters.isBestseller !== undefined) {
        query = query.eq('bestseller', filters.isBestseller);
      }

      // Apply text search filter across name, description, and category name
      if (filters.search) {
        const { data: matchingCategories } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', `%${filters.search}%`);

        const categoryIds = matchingCategories?.map((c) => c.id) || [];

        if (categoryIds.length > 0) {
          const idsString = categoryIds.map((id) => `'${id}'`).join(',');
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category_id.in.(${idsString})`);
        } else {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination range
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        logger.error(`Database error fetching products: ${error.message}`);
        throw new AppError('Failed to fetch products', 500);
      }

      const formattedProducts = (data || []).map((prod) => this.formatProduct(prod));

      return {
        products: formattedProducts,
        count: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching products: ${err}`);
      throw new AppError('Internal server error during product retrieval', 500);
    }
  }

  /**
   * Query a single product by its ID
   */
  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
          `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching product ID ${id}: ${error.message}`);
        throw new AppError('Failed to fetch product details', 500);
      }

      return this.formatProduct(data);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching product details for ID ${id}: ${err}`);
      throw new AppError('Internal server error during product details retrieval', 500);
    }
  }

  /**
   * Query a single product by Slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
          `
        )
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching product slug ${slug}: ${error.message}`);
        throw new AppError('Failed to fetch product details', 500);
      }

      return this.formatProduct(data);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching product details by slug: ${err}`);
      throw new AppError('Internal server error during product details retrieval', 500);
    }
  }

  /**
   * Create a new product
   */
  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'variants' | 'featured_image' | 'gallery_images'>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating product: ${error.message}`);
        throw new AppError('Failed to create product', 500);
      }

      return this.formatProduct(data);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating product: ${err}`);
      throw new AppError('Internal server error during product creation', 500);
    }
  }

  /**
   * Update product
   */
  async update(id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'variants' | 'featured_image' | 'gallery_images'>>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating product ${id}: ${error.message}`);
        throw new AppError('Failed to update product', 500);
      }

      return this.formatProduct(data);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating product ${id}: ${err}`);
      throw new AppError('Internal server error during product update', 500);
    }
  }

  /**
   * Soft delete product
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        logger.error(`Database error soft-deleting product ${id}: ${error.message}`);
        throw new AppError('Failed to delete product', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error soft-deleting product ${id}: ${err}`);
      throw new AppError('Internal server error during product deletion', 500);
    }
  }

  /**
   * Insert product images in bulk
   */
  async createImages(images: Omit<ProductImage, 'id' | 'created_at'>[]): Promise<ProductImage[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_images')
        .insert(images)
        .select();

      if (error) {
        logger.error(`Database error creating product images: ${error.message}`);
        throw new AppError('Failed to create product images', 500);
      }

      return data as ProductImage[];
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating images: ${err}`);
      throw new AppError('Internal server error during images insertion', 500);
    }
  }

  /**
   * Delete product images by Product ID
   */
  async deleteImagesByProductId(productId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (error) {
        logger.error(`Database error deleting product images for product ID ${productId}: ${error.message}`);
        throw new AppError('Failed to clear product images', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error clearing images: ${err}`);
      throw new AppError('Internal server error during images cleanup', 500);
    }
  }

  /**
   * Create product variant
   */
  async createVariant(variant: Omit<ProductVariant, 'id' | 'created_at'>): Promise<ProductVariant> {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .insert([variant])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating variant: ${error.message}`);
        throw new AppError('Failed to create variant', 500);
      }

      return data as ProductVariant;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error creating variant: ${err}`);
      throw new AppError('Internal server error during variant creation', 500);
    }
  }

  /**
   * Delete product variants by Product ID
   */
  async deleteVariantsByProductId(productId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      if (error) {
        logger.error(`Database error deleting variants for product ID ${productId}: ${error.message}`);
        throw new AppError('Failed to clear product variants', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error clearing variants: ${err}`);
      throw new AppError('Internal server error during variants cleanup', 500);
    }
  }
}
