import { body } from 'express-validator';

export const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('Le prenom est requis'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email invalide'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 8 }).withMessage('Numero de telephone invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caracteres'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Un email ou un numero de telephone est requis');
    }
    return true;
  }),
];

export const loginValidator = [
  body('identifier').notEmpty().withMessage('Email ou telephone requis'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];