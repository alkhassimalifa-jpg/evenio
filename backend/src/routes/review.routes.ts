import { Router } from 'express';
import { createReview, getEventReviews, deleteReview } from '../controllers/review.controller';
import { reviewValidator } from '../validators/review.validator';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, reviewValidator, createReview);
router.get('/event/:eventId', getEventReviews);
router.delete('/:id', authenticate, deleteReview);

export default router;