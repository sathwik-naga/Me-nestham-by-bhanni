import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductFilters } from '../interfaces/product.interface';

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const productService = new ProductService(productRepository, categoryRepository);

export class ProductController {
  /**
   * GET /api/products
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as ProductFilters;
      const { products, count, totalPages } = await productService.listProducts(filters);

      res.status(200).json({
        status: 'success',
        results: products.length,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 12,
          total: count,
          totalPages,
        },
        data: {
          products,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/featured
   */
  async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const products = await productService.getFeaturedProducts(limit);

      res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
          products,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/bestsellers
   */
  async getBestsellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const products = await productService.getBestsellerProducts(limit);

      res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
          products,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/new
   */
  async getNew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const products = await productService.getNewProducts(limit);

      res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
          products,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:idOrSlug
   */
  async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idOrSlug } = req.params;
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);

      const product = isUuid
        ? await productService.getProductDetails(idOrSlug)
        : await productService.getProductBySlug(idOrSlug);

      res.status(200).json({
        status: 'success',
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products (Admin Only)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id (Admin Only)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id (Admin Only - Soft Delete)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
