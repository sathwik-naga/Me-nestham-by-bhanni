import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { Product, ProductFilters } from '../interfaces/product.interface';
import { slugify } from '../utils/slugify';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async listProducts(filters: ProductFilters): Promise<{ products: Product[]; count: number; totalPages: number }> {
    const { products, count } = await this.productRepository.getProducts(filters);
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(count / limit);

    return {
      products,
      count,
      totalPages,
    };
  }

  async getProductDetails(id: string): Promise<Product> {
    const product = await this.productRepository.getById(id);
    if (!product) {
      throw new AppError(`Product not found with ID ${id}`, 404);
    }
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.getBySlug(slug);
    if (!product) {
      throw new AppError(`Product not found with slug '${slug}'`, 404);
    }
    return product;
  }

  /**
   * Helper to retrieve featured products
   */
  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({
      page: 1,
      limit,
      isFeatured: true,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return products;
  }

  /**
   * Helper to retrieve bestseller products
   */
  async getBestsellerProducts(limit = 10): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({
      page: 1,
      limit,
      isBestseller: true,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return products;
  }

  /**
   * Helper to retrieve recently added products
   */
  async getNewProducts(limit = 10): Promise<Product[]> {
    const { products } = await this.productRepository.getProducts({
      page: 1,
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return products;
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
    images?: { image_url: string; is_featured: boolean; position: number }[];
    variants?: { sku: string; name: string; price: number; stock_quantity: number }[];
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
      image_url: payload.image_url || null,
    });

    if (payload.images && payload.images.length > 0) {
      const imagesToInsert = payload.images.map((img) => ({
        product_id: product.id,
        image_url: img.image_url,
        is_featured: img.is_featured,
        position: img.position,
      }));
      await this.productRepository.createImages(imagesToInsert);
    }

    if (payload.variants && payload.variants.length > 0) {
      for (const variant of payload.variants) {
        await this.productRepository.createVariant({
          product_id: product.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          stock_quantity: variant.stock_quantity,
        });
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
      images: { image_url: string; is_featured: boolean; position: number }[];
      variants: { sku: string; name: string; price: number; stock_quantity: number }[];
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

    await this.productRepository.update(id, updatedData);

    if (payload.images) {
      await this.productRepository.deleteImagesByProductId(id);
      if (payload.images.length > 0) {
        const imagesToInsert = payload.images.map((img) => ({
          product_id: id,
          image_url: img.image_url,
          is_featured: img.is_featured,
          position: img.position,
        }));
        await this.productRepository.createImages(imagesToInsert);
      }
    }

    if (payload.variants) {
      await this.productRepository.deleteVariantsByProductId(id);
      if (payload.variants.length > 0) {
        for (const variant of payload.variants) {
          await this.productRepository.createVariant({
            product_id: id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            stock_quantity: variant.stock_quantity,
          });
        }
      }
    }

    const populated = await this.productRepository.getById(id);
    if (!populated) throw new AppError('Failed to fetch updated product', 500);
    return populated;
  }

  async deleteProduct(id: string): Promise<void> {
    logger.info(`Soft deleting product ID: ${id}`);
    const existingProduct = await this.productRepository.getById(id);
    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }
    await this.productRepository.delete(id);
  }
}
