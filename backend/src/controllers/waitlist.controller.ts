import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from './notification.controller';

// Rejoindre la liste d'attente d'un evenement complet
export const joinWaitlist = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;
  const userId = req.user!.id;

  if (!eventId) return res.status(400).json({ error: 'eventId requis' });

  try {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Tu es deja sur la liste d\'attente de cet evenement' });
    }

    const entry = await prisma.waitlistEntry.create({
      data: { eventId, userId },
    });

    return res.status(201).json({ message: 'Inscription sur la liste d\'attente reussie', entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

// Quitter la liste d'attente
export const leaveWaitlist = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  try {
    await prisma.waitlistEntry.deleteMany({ where: { eventId, userId } });
    return res.json({ message: 'Retire de la liste d\'attente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur' });
  }
};

// Verifie si l'utilisateur connecte est deja sur la liste d'attente d'un evenement
export const getMyWaitlistStatus = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return res.json({ onWaitlist: !!entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur' });
  }
};

// ORGANIZER/ADMIN : liste des personnes en attente pour un evenement
export const getEventWaitlist = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evenement introuvable' });

    if (event.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const waitlist = await prisma.waitlistEntry.findMany({
      where: { eventId },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(waitlist);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur' });
  }
};

// Utilitaire : notifie les N premiers de la liste d'attente qu'une place s'est liberee
// Appele automatiquement quand la capacite d'un ticket augmente
export const notifyWaitlistIfSpotsOpened = async (eventId: string, newSpotsCount: number) => {
  if (newSpotsCount <= 0) return;

  try {
    const waiting = await prisma.waitlistEntry.findMany({
      where: { eventId, notified: false },
      orderBy: { createdAt: 'asc' },
      take: newSpotsCount,
      include: { event: { select: { title: true } } },
    });

    for (const entry of waiting) {
      await createNotification(
        entry.userId,
        'Une place s\'est liberee !',
        `Une place vient de se liberer pour "${entry.event.title}". Depeche-toi de reserver !`
      );
      await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { notified: true } });
    }
  } catch (err) {
    console.error('Erreur notification liste d\'attente:', err);
  }
};