import { body } from 'express-validator';

export const createTicketValidator = [
  body('name').trim().notEmpty().withMessage('Le nom du billet est requis'),
  body('type').isIn(['STANDARD', 'VIP', 'EARLY_BIRD']).withMessage('Type de billet invalide'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
];

export const updateTicketValidator = [
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['STANDARD', 'VIP', 'EARLY_BIRD']),
  body('price').optional().isFloat({ min: 0 }),
  body('quantity').optional().isInt({ min: 1 }),
];