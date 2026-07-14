import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../interfaces/product.interface';
import { slugify } from '../utils/slugify';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async listCategories(): Promise<Category[]> {
    return this.categoryRepository.getAll();
  }

  async getCategoryDetails(idOrSlug: string): Promise<Category> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);
    
    const category = isUuid
      ? await this.categoryRepository.getById(idOrSlug)
      : await this.categoryRepository.getBySlug(idOrSlug);

    if (!category) {
      throw new AppError(`Category not found with reference '${idOrSlug}'`, 404);
    }
    return category;
  }

  async createCategory(payload: { name: string; description?: string | null; image_url?: string | null }): Promise<Category> {
    logger.info(`Creating category: ${payload.name}`);
    const slug = slugify(payload.name);

    const existing = await this.categoryRepository.getBySlug(slug);
    if (existing) {
      throw new AppError(`Category with slug '${slug}' already exists`, 400);
    }

    return this.categoryRepository.create({
      name: payload.name,
      slug,
      description: payload.description,
      image_url: payload.image_url,
      is_active: true,
    });
  }

  async updateCategory(id: string, payload: Partial<{ name: string; description: string | null; image_url: string | null }>): Promise<Category> {
    logger.info(`Updating category ID ${id}`);

    const existingCategory = await this.categoryRepository.getById(id);
    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }

    const updatedData: Partial<Omit<Category, 'id' | 'created_at'>> = { ...payload };

    if (payload.name) {
      const slug = slugify(payload.name);
      if (slug !== existingCategory.slug) {
        const existingSlug = await this.categoryRepository.getBySlug(slug);
        if (existingSlug) {
          throw new AppError(`Category with slug '${slug}' already exists`, 400);
        }
        updatedData.slug = slug;
      }
    }

    return this.categoryRepository.update(id, updatedData);
  }

  async deleteCategory(id: string): Promise<void> {
    logger.info(`Deleting category ID ${id}`);
    const existingCategory = await this.categoryRepository.getById(id);
    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }
    await this.categoryRepository.delete(id);
  }
}
