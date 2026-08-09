import { Router } from 'express';
import { createTicket, getTicketsByEvent, updateTicket, deleteTicket } from '../controllers/ticket.controller';
import { createTicketValidator, updateTicketValidator } from '../validators/ticket.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/event/:eventId', getTicketsByEvent);
router.post('/event/:eventId', authenticate, authorize('ORGANIZER', 'ADMIN'), createTicketValidator, createTicket);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateTicketValidator, updateTicket);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteTicket);

export default router;