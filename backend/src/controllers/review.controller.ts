import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createReview = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId, rating, comment } = req.body;
  const userId = req.user!.id;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evenement introuvable' });

    // Vérifie que l'utilisateur a bien participé à l'événement
    const attended = await prisma.attendee.findFirst({ where: { eventId, userId } });
    if (!attended) {
      return res.status(403).json({ error: 'Vous devez avoir participe a cet evenement pour laisser un avis' });
    }

    const existing = await prisma.review.findFirst({ where: { eventId, userId } });
    if (existing) {
      return res.status(409).json({ error: 'Vous avez deja laisse un avis pour cet evenement' });
    }

    const review = await prisma.review.create({
      data: { eventId, userId, rating: parseInt(rating), comment },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la creation de l avis' });
  }
};

export const getEventReviews = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({ reviews, averageRating: Math.round(avgRating * 10) / 10, total: reviews.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Avis introuvable' });

    if (review.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    await prisma.review.delete({ where: { id } });
    return res.json({ message: 'Avis supprime avec succes' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};