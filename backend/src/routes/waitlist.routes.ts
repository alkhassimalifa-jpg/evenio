import { Router } from 'express';
import { joinWaitlist, leaveWaitlist, getMyWaitlistStatus, getEventWaitlist } from '../controllers/waitlist.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, joinWaitlist);
router.delete('/:eventId', authenticate, leaveWaitlist);
router.get('/:eventId/status', authenticate, getMyWaitlistStatus);
router.get('/:eventId/list', authenticate, getEventWaitlist);

export default router;