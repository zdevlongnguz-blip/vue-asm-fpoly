import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getCategories).post(authorize('admin'), createCategory);
router.route('/:id').put(authorize('admin'), updateCategory).delete(authorize('admin'), deleteCategory);

export default router;
