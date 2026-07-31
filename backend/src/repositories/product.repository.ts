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
   * Enrich variants with their options and images in bulk
   */
  private async enrichVariants(products: Product[]): Promise<Product[]> {
    const allVariants: any[] = [];
    products.forEach((p) => {
      if (p.variants && Array.isArray(p.variants)) {
        allVariants.push(...p.variants);
      }
    });

    if (allVariants.length === 0) return products;

    const variantIds = allVariants.map((v) => v.id);

    let optionsMap: Record<string, any[]> = {};
    let imagesMap: Record<string, any[]> = {};

    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from('variant_options')
        .select('*')
        .in('variant_id', variantIds);

      if (!optionsError && optionsData) {
        optionsData.forEach((opt: any) => {
          if (!optionsMap[opt.variant_id]) optionsMap[opt.variant_id] = [];
          optionsMap[opt.variant_id].push({
            option_name: opt.option_name,
            option_value: opt.option_value,
          });
        });
      }
    } catch (err) {
      logger.warn(`Failed to fetch variant_options (may not exist yet): ${err}`);
    }

    try {
      const { data: imagesData, error: imagesError } = await supabase
        .from('variant_images')
        .select('*')
        .in('variant_id', variantIds)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });

      if (!imagesError && imagesData) {
        imagesData.forEach((img: any) => {
          if (!imagesMap[img.variant_id]) imagesMap[img.variant_id] = [];
          
          let publicUrl = img.image_url;
          if (img.storage_path) {
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(img.storage_path);
            if (data?.publicUrl) {
              publicUrl = data.publicUrl;
            }
          }

          imagesMap[img.variant_id].push({
            id: img.id,
            variant_id: img.variant_id,
            storage_path: img.storage_path || null,
            image_url: publicUrl || '',
            media_type: img.media_type || 'image',
            alt_text: img.alt_text || null,
            sort_order: img.sort_order !== undefined && img.sort_order !== null ? img.sort_order : (img.position || 0),
            is_primary: !!img.is_primary,
            position: img.sort_order !== undefined && img.sort_order !== null ? img.sort_order : (img.position || 0),
          });
        });
      }
    } catch (err) {
      logger.warn(`Failed to fetch variant_images (may not exist yet): ${err}`);
    }

    // Enrich variants
    allVariants.forEach((v) => {
      // Normalize name & stock: DB has `variant_name` and `stock`
      v.name = v.name || v.variant_name || [v.color, v.size].filter(Boolean).join(" / ") || "Default";
      v.stock = v.stock !== undefined ? v.stock : (v.stock_quantity || 0);
      v.stock_quantity = v.stock_quantity !== undefined ? v.stock_quantity : v.stock;

      // Populate options
      if (optionsMap[v.id]) {
        v.options = optionsMap[v.id];
      } else {
        // Fallback to size, color, material columns if options are empty
        const fallbackOptions: any[] = [];
        if (v.size) fallbackOptions.push({ option_name: 'Size', option_value: v.size });
        if (v.color) fallbackOptions.push({ option_name: 'Color', option_value: v.color });
        if (v.material) fallbackOptions.push({ option_name: 'Material', option_value: v.material });
        v.options = fallbackOptions;
      }

      // Populate images
      if (imagesMap[v.id]) {
        v.images = imagesMap[v.id];
      } else {
        v.images = [];
      }
    });

    return products;
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
      await this.enrichVariants(formattedProducts);

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

      const formatted = this.formatProduct(data);
      await this.enrichVariants([formatted]);
      return formatted;
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

      const formatted = this.formatProduct(data);
      await this.enrichVariants([formatted]);
      return formatted;
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
      if (Object.keys(product).length === 0) {
        const existing = await this.getById(id);
        if (!existing) throw new AppError('Product not found', 404);
        return existing;
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating product ${id}: ${error.message}`);
        throw new AppError(`Failed to update product: ${error.message}`, 500);
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
      const insertPayload: Record<string, any> = {
        product_id: variant.product_id,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock !== undefined ? variant.stock : (variant.stock_quantity || 0),
        sale_price: variant.sale_price !== undefined ? variant.sale_price : null,
        weight: variant.weight !== undefined ? variant.weight : null,
        is_default: variant.is_default || false,
        status: variant.status || 'active',
        variant_name: variant.name || (variant as any).variant_name || '',
      };

      if (variant.size !== undefined && variant.size !== null) insertPayload.size = variant.size;
      if (variant.color !== undefined && variant.color !== null) insertPayload.color = variant.color;
      if (variant.material !== undefined && variant.material !== null) insertPayload.material = variant.material;

      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating variant: ${error.message}`);
        throw new AppError(`Failed to create variant: ${error.message}`, 500);
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

  /**
   * Insert variant options in bulk
   */
  async createVariantOptions(options: { variant_id: string; option_name: string; option_value: string }[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('variant_options')
        .insert(options);
      if (error) {
        logger.error(`Database error creating variant options: ${error.message}`);
      }
    } catch (err) {
      logger.error(`Unexpected error creating variant options: ${err}`);
    }
  }

  /**
   * Insert variant images in bulk
   */
  async createVariantImages(images: {
    variant_id: string;
    image_url?: string;
    storage_path?: string | null;
    media_type?: string;
    alt_text?: string | null;
    sort_order?: number;
    is_primary?: boolean;
    position?: number;
  }[]): Promise<void> {
    try {
      if (!images || images.length === 0) return;

      // Group images by variant_id to enforce single primary image rule
      const groupedByVariant: Record<string, typeof images> = {};
      images.forEach((img) => {
        if (!groupedByVariant[img.variant_id]) groupedByVariant[img.variant_id] = [];
        groupedByVariant[img.variant_id].push(img);
      });

      const formattedPayloads: any[] = [];

      Object.values(groupedByVariant).forEach((variantImgs) => {
        let hasPrimary = variantImgs.some((i) => i.is_primary === true);
        
        variantImgs.forEach((img, idx) => {
          // Single primary image rule: if no primary selected, default first image to primary
          const isPrimary = hasPrimary ? (img.is_primary === true) : (idx === 0);
          if (isPrimary) hasPrimary = true; // only first marked primary stays true

          const order = img.sort_order !== undefined ? img.sort_order : (img.position !== undefined ? img.position : idx);

          formattedPayloads.push({
            variant_id: img.variant_id,
            storage_path: img.storage_path || null,
            image_url: img.image_url || null,
            media_type: img.media_type || 'image',
            alt_text: img.alt_text || null,
            sort_order: order,
            position: order,
            is_primary: isPrimary,
          });
        });
      });

      const { error } = await supabaseAdmin
        .from('variant_images')
        .insert(formattedPayloads);

      if (error) {
        logger.error(`Database error creating variant images: ${error.message}`);
      }
    } catch (err) {
      logger.error(`Unexpected error creating variant images: ${err}`);
    }
  }
}
