import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkoutSchema, updateOrderSchema } from '../validators/order.validator';

const router = Router();
const orderController = new OrderController();

// Apply auth middleware to protect all order routes
router.use(authMiddleware);

router.post('/checkout', validate(checkoutSchema), (req, res, next) => orderController.checkout(req, res, next));
router.get('/', (req, res, next) => orderController.listOrders(req, res, next));
router.get('/:orderId', (req, res, next) => orderController.getOrder(req, res, next));
router.put('/:orderId', validate(updateOrderSchema), (req, res, next) => orderController.updateOrder(req, res, next));

export default router;
