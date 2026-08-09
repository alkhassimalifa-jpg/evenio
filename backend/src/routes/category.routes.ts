import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/category.controller';
import { categoryValidator } from '../validators/category.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize('ADMIN'), categoryValidator, createCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;