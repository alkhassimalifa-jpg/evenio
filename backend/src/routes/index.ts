import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import categoryRoutes from './category.routes';
import ticketRoutes from './ticket.routes';
import orderRoutes from './order.routes';
import checkinRoutes from './checkin.routes';
import userRoutes from './user.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard.routes';
import waitlistRoutes from './waitlist.routes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/categories', categoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/orders', orderRoutes);
router.use('/checkin', checkinRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/waitlist', waitlistRoutes);

export default router;