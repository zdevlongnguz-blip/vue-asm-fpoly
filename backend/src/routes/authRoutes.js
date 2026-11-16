import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', protect, me);
router.post('/register', protect, authorize('admin'), register);

export default router;
