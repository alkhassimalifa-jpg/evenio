import { body } from 'express-validator';

export const reviewValidator = [
  body('eventId').notEmpty().withMessage('L evenement est requis'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit etre entre 1 et 5'),
  body('comment').optional().trim(),
];