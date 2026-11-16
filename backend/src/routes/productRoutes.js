import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

// admin + staff được xem; chỉ admin được thêm/sửa/xóa
router.route('/').get(getProducts).post(authorize('admin'), createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(authorize('admin'), updateProduct)
  .delete(authorize('admin'), deleteProduct);

export default router;
