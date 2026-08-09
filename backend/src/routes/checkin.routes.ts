import { Router } from 'express';
import { scanQRCode, getAttendanceList } from '../controllers/checkin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/scan', authenticate, authorize('ORGANIZER', 'ADMIN'), scanQRCode);
router.get('/event/:eventId/attendance', authenticate, authorize('ORGANIZER', 'ADMIN'), getAttendanceList);

export default router;