import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/order.controller';
import { createOrderValidator } from '../validators/order.validator';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createOrderValidator, createOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/cancel', authenticate, cancelOrder);

export default router;