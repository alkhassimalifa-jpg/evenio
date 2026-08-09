import { Router } from 'express';
import { updateProfile, getAllUsers, updateUserRole, deleteUser } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.put('/profile', authenticate, updateProfile);
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/:id/role', authenticate, authorize('ADMIN'), updateUserRole);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;