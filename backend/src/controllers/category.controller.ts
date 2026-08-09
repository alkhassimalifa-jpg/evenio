import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { events: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }

    const category = await prisma.category.create({
      data: { name, slug: generateSlug(name) },
    });

    return res.status(201).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};