import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();
const cartController = new CartController();

// Apply authentication middleware to all cart endpoints
router.use(authMiddleware);

router.get('/', (req, res, next) => cartController.getCart(req, res, next));
router.post('/items', validate(addToCartSchema), (req, res, next) => cartController.addItem(req, res, next));
router.put('/items/:itemId', validate(updateCartItemSchema), (req, res, next) => cartController.updateItem(req, res, next));
router.delete('/items/:itemId', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/', (req, res, next) => cartController.clearCart(req, res, next));

export default router;
