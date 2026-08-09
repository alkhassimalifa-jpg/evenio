import { body } from 'express-validator';

export const createOrderValidator = [
  body('eventId').notEmpty().withMessage('L\'evenement est requis'),
  body('items').isArray({ min: 1 }).withMessage('Au moins un billet est requis'),
  body('items.*.ticketId').notEmpty().withMessage('Le type de billet est requis'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('La quantite doit etre positive'),
];