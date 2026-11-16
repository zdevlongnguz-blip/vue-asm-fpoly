import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getCustomers).post(createCustomer);

export default router;
