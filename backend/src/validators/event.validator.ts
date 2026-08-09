import { body } from 'express-validator';

export const createEventValidator = [
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('location').trim().notEmpty().withMessage('Le lieu est requis'),
  body('city').trim().notEmpty().withMessage('La ville est requise'),
  body('startDate').isISO8601().withMessage('Date de début invalide'),
  body('endDate').isISO8601().withMessage('Date de fin invalide'),
  body('capacity').isInt({ min: 1 }).withMessage('La capacité doit être un entier positif'),
  body('categoryId').notEmpty().withMessage('La catégorie est requise'),
  body('isFree').optional().isBoolean(),
];

export const updateEventValidator = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('capacity').optional().isInt({ min: 1 }),
  body('categoryId').optional().notEmpty(),
];