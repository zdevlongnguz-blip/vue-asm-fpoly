import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getStatusFlow,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/meta/status-flow', getStatusFlow);
router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder).delete(authorize('admin'), deleteOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
