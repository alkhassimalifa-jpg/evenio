import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, phone, avatarUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, avatarUrl: true, phone: true, createdAt: true,
      },
    });

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la mise a jour du profil' });
  }
};

// Admin : liste de tous les utilisateurs
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const { role, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  try {
    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true,
          role: true, isVerified: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Admin : changer le rôle d'un utilisateur
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['ADMIN', 'ORGANIZER', 'PARTICIPANT'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role invalide' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la mise a jour du role' });
  }
};

// Admin : supprimer un utilisateur
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'Utilisateur supprime avec succes' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};