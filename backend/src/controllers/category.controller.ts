import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { cacheService } from '../services/cache.service';

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);

export class CategoryController {
  /**
   * GET /api/categories
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'mn_cache_categories_all';
      const cached = await cacheService.get<any[]>(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.status(200).json({
          status: 'success',
          results: cached.length,
          data: { categories: cached },
        });
        return;
      }

      const categories = await categoryService.listCategories();
      await cacheService.set(cacheKey, categories, 86400); // 24 Hours TTL

      res.setHeader('X-Cache', 'MISS');
      res.status(200).json({
        status: 'success',
        results: categories.length,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:idOrSlug
   */
  async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryDetails(req.params.idOrSlug);
      res.status(200).json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories (Admin Only)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      await cacheService.invalidateAll();
      res.status(201).json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/categories/:id (Admin Only)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id (Admin Only)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
