import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();
const categoryController = new CategoryController();

// Public Routes
router.get('/', (req, res, next) => categoryController.getAll(req, res, next));
router.get('/:idOrSlug', (req, res, next) => categoryController.getByIdOrSlug(req, res, next));

// Admin Protected Routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createCategorySchema),
  (req, res, next) => categoryController.create(req, res, next)
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(updateCategorySchema),
  (req, res, next) => categoryController.update(req, res, next)
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => categoryController.delete(req, res, next)
);

export default router;
