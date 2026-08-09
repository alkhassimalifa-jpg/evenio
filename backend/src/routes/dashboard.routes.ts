import { Router } from 'express';
import { getOrganizerStats, exportAttendeesCSV } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/stats', authenticate, authorize('ORGANIZER', 'ADMIN'), getOrganizerStats);
router.get('/export/:eventId', authenticate, authorize('ORGANIZER', 'ADMIN'), exportAttendeesCSV);

export default router;