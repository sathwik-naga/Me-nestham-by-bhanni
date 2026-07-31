import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { Product, ProductFilters } from '../interfaces/product.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;

  constructor(
    productRepository?: ProductRepository,
    categoryRepository?: CategoryRepository
  ) {
    this.productRepository = productRepository || new ProductRepository();
    this.categoryRepository = categoryRepository || new CategoryRepository();
  }

  async listProducts(filters: ProductFilters): Promise<{ products: Product[]; count: number; totalPages: number }> {
    const { products, count } = await this.productRepository.getProducts(filters);
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(count / limit) || 1;
    return { products, count, totalPages };
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({ isFeatured: true, limit });
    return products;
  }

  async getBestsellerProducts(limit = 8): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({ isBestseller: true, limit });
    return products;
  }

  async getNewProducts(limit = 8): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({ limit, sortBy: 'created_at', sortOrder: 'desc' });
    return products;
  }

  async getProductDetails(id: string): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.getBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async createProduct(payload: {
    category_id: string;
    name: string;
    description: string;
    price: number;
    compare_price?: number | null;
    stock?: number;
    is_active?: boolean;
    featured?: boolean;
    bestseller?: boolean;
    image_url?: string | null;
    images?: { image_url: string; is_featured?: boolean; position?: number }[];
    variants?: {
      sku: string;
      name?: string;
      variant_name?: string;
      price: number;
      sale_price?: number | null;
      stock?: number;
      stock_quantity?: number;
      weight?: number | null;
      is_default?: boolean;
      status?: string;
      options?: { option_name: string; option_value: string }[];
      images?: {
        image_url?: string;
        storage_path?: string | null;
        media_type?: string;
        alt_text?: string | null;
        sort_order?: number;
        is_primary?: boolean;
        position?: number;
      }[];
    }[];
  }): Promise<Product> {
    logger.info(`Creating product: ${payload.name}`);

    const category = await this.categoryRepository.getById(payload.category_id);
    if (!category) {
      throw new AppError(`Category with ID ${payload.category_id} not found`, 400);
    }

    const slug = slugify(payload.name);
    const existing = await this.productRepository.getBySlug(slug);
    if (existing) {
      throw new AppError(`Product with slug '${slug}' already exists`, 400);
    }

    const mainImageUrl = payload.image_url || (payload.images && payload.images.length > 0 ? payload.images[0].image_url : null);

    const product = await this.productRepository.create({
      category_id: payload.category_id,
      name: payload.name,
      slug,
      description: payload.description,
      price: payload.price,
      compare_price: payload.compare_price || null,
      stock: payload.stock ?? 0,
      is_active: payload.is_active ?? true,
      featured: payload.featured ?? false,
      bestseller: payload.bestseller ?? false,
      image_url: mainImageUrl,
    });

    if (payload.images && payload.images.length > 0) {
      const imagesToInsert = payload.images.map((img, idx) => {
        const order = img.position !== undefined ? img.position : idx;
        const isFeatured = idx === 0 || (img.is_featured === true);
        return {
          product_id: product.id,
          image_url: img.image_url,
          is_featured: isFeatured,
          position: order,
          sort_order: order,
          alt_text: payload.name || null,
        };
      });
      await this.productRepository.createImages(imagesToInsert as any);
    }

    if (payload.variants && payload.variants.length > 0) {
      for (const variant of payload.variants) {
        const createdVar = await this.productRepository.createVariant({
          product_id: product.id,
          sku: variant.sku,
          variant_name: (variant as any).variant_name || variant.name || '',
          name: variant.name || (variant as any).variant_name || '',
          price: variant.price,
          sale_price: variant.sale_price !== undefined ? variant.sale_price : null,
          stock: variant.stock !== undefined ? variant.stock : (variant.stock_quantity || 0),
          stock_quantity: variant.stock_quantity !== undefined ? variant.stock_quantity : (variant.stock || 0),
          weight: variant.weight !== undefined ? variant.weight : null,
          is_default: variant.is_default || false,
          status: variant.status || 'active',
        });

        if (variant.options && variant.options.length > 0) {
          const opts = variant.options.map((o) => ({
            variant_id: createdVar.id,
            option_name: o.option_name,
            option_value: o.option_value,
          }));
          await (this.productRepository as any).createVariantOptions(opts);
        }

        if (variant.images && variant.images.length > 0) {
          const imgs = variant.images.map((img, idx) => ({
            variant_id: createdVar.id,
            image_url: img.image_url,
            storage_path: img.storage_path || null,
            media_type: img.media_type || 'image',
            alt_text: img.alt_text || null,
            sort_order: img.sort_order !== undefined ? img.sort_order : (img.position !== undefined ? img.position : idx),
            is_primary: !!img.is_primary,
          }));
          await (this.productRepository as any).createVariantImages(imgs);
        }
      }
    }

    const populated = await this.productRepository.getById(product.id);
    if (!populated) throw new AppError('Failed to fetch created product', 500);
    return populated;
  }

  async updateProduct(
    id: string,
    payload: Partial<{
      category_id: string;
      name: string;
      description: string;
      price: number;
      compare_price: number | null;
      stock: number;
      is_active: boolean;
      featured: boolean;
      bestseller: boolean;
      image_url: string | null;
      images: { image_url: string; is_featured?: boolean; position?: number }[];
      variants: {
        sku: string;
        name?: string;
        variant_name?: string;
        price: number;
        sale_price?: number | null;
        stock?: number;
        stock_quantity?: number;
        weight?: number | null;
        is_default?: boolean;
        status?: string;
        options?: { option_name: string; option_value: string }[];
        images?: {
          image_url?: string;
          storage_path?: string | null;
          media_type?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          position?: number;
        }[];
      }[];
    }>
  ): Promise<Product> {
    logger.info(`Updating product ID: ${id}`);

    const existingProduct = await this.productRepository.getById(id);
    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    const updatedData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'variants' | 'featured_image' | 'gallery_images'>> = {};

    if (payload.category_id) {
      const category = await this.categoryRepository.getById(payload.category_id);
      if (!category) {
        throw new AppError(`Category with ID ${payload.category_id} not found`, 400);
      }
      updatedData.category_id = payload.category_id;
    }

    if (payload.name) {
      const slug = slugify(payload.name);
      if (slug !== existingProduct.slug) {
        const existingSlug = await this.productRepository.getBySlug(slug);
        if (existingSlug) {
          throw new AppError(`Product with slug '${slug}' already exists`, 400);
        }
        updatedData.slug = slug;
      }
      updatedData.name = payload.name;
    }

    if (payload.description !== undefined) updatedData.description = payload.description;
    if (payload.price !== undefined) updatedData.price = payload.price;
    if (payload.compare_price !== undefined) updatedData.compare_price = payload.compare_price;
    if (payload.stock !== undefined) updatedData.stock = payload.stock;
    if (payload.is_active !== undefined) updatedData.is_active = payload.is_active;
    if (payload.featured !== undefined) updatedData.featured = payload.featured;
    if (payload.bestseller !== undefined) updatedData.bestseller = payload.bestseller;
    if (payload.image_url !== undefined) updatedData.image_url = payload.image_url;

    if (payload.images && payload.images.length > 0) {
      updatedData.image_url = payload.images[0].image_url;
    }

    await this.productRepository.update(id, updatedData);

    if (payload.images) {
      await this.productRepository.deleteImagesByProductId(id);
      if (payload.images.length > 0) {
        const imagesToInsert = payload.images.map((img, idx) => {
          const order = img.position !== undefined ? img.position : idx;
          const isFeatured = idx === 0 || (img.is_featured === true);
          return {
            product_id: id,
            image_url: img.image_url,
            is_featured: isFeatured,
            position: order,
            sort_order: order,
            alt_text: payload.name || existingProduct.name || null,
          };
        });
        await this.productRepository.createImages(imagesToInsert as any);
      }
    }

    if (payload.variants) {
      await this.productRepository.deleteVariantsByProductId(id);
      if (payload.variants.length > 0) {
        for (const variant of payload.variants) {
          const createdVar = await this.productRepository.createVariant({
            product_id: id,
            sku: variant.sku,
            variant_name: (variant as any).variant_name || variant.name || '',
            name: variant.name || (variant as any).variant_name || '',
            price: variant.price,
            sale_price: variant.sale_price !== undefined ? variant.sale_price : null,
            stock: variant.stock !== undefined ? variant.stock : (variant.stock_quantity || 0),
            stock_quantity: variant.stock_quantity !== undefined ? variant.stock_quantity : (variant.stock || 0),
            weight: variant.weight !== undefined ? variant.weight : null,
            is_default: variant.is_default || false,
            status: variant.status || 'active',
          });

          if (variant.options && variant.options.length > 0) {
            const opts = variant.options.map((o) => ({
              variant_id: createdVar.id,
              option_name: o.option_name,
              option_value: o.option_value,
            }));
            await (this.productRepository as any).createVariantOptions(opts);
          }

          if (variant.images && variant.images.length > 0) {
            const imgs = variant.images.map((img, idx) => ({
              variant_id: createdVar.id,
              image_url: img.image_url,
              storage_path: img.storage_path || null,
              media_type: img.media_type || 'image',
              alt_text: img.alt_text || null,
              sort_order: img.sort_order !== undefined ? img.sort_order : (img.position !== undefined ? img.position : idx),
              is_primary: !!img.is_primary,
            }));
            await (this.productRepository as any).createVariantImages(imgs);
          }
        }
      }
    }

    const populated = await this.productRepository.getById(id);
    if (!populated) throw new AppError('Failed to fetch updated product', 500);
    return populated;
  }

  async deleteProduct(id: string): Promise<void> {
    logger.info(`Deleting product ID: ${id}`);
    const existing = await this.productRepository.getById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    await this.productRepository.delete(id);
  }
}
