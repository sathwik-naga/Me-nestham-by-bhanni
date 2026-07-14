import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { productQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();
const productController = new ProductController();

// Public Routes
router.get('/', validate(productQuerySchema), (req, res, next) => productController.getAll(req, res, next));
router.get('/featured', (req, res, next) => productController.getFeatured(req, res, next));
router.get('/bestsellers', (req, res, next) => productController.getBestsellers(req, res, next));
router.get('/new', (req, res, next) => productController.getNew(req, res, next));
router.get('/:idOrSlug', (req, res, next) => productController.getByIdOrSlug(req, res, next));

// Admin Protected Routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createProductSchema),
  (req, res, next) => productController.create(req, res, next)
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(updateProductSchema),
  (req, res, next) => productController.update(req, res, next)
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => productController.delete(req, res, next)
);

export default router;
