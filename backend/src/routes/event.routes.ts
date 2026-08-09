import { Router } from 'express';
import {
  createEvent, getEvents, getEventBySlug, getMyEvents,
  updateEvent, updateEventStatus, deleteEvent,
  getPendingEvents, moderateEvent, reportEvent,
} from '../controllers/event.controller';
import { createEventValidator, updateEventValidator } from '../validators/event.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/', getEvents);
router.get('/slug/:slug', getEventBySlug);

router.get('/my/events', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEventValidator, createEvent);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEventValidator, updateEvent);
router.patch('/:id/status', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEventStatus);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);

router.get('/admin/pending', authenticate, authorize('ADMIN'), getPendingEvents);
router.patch('/admin/:id/moderate', authenticate, authorize('ADMIN'), moderateEvent);

router.post('/report', authenticate, reportEvent);

export default router;