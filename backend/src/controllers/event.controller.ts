import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from './notification.controller';
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-6);
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, location, city, startDate, endDate,
    capacity, categoryId, isFree, imageUrl,
  } = req.body;

  try {
    const event = await prisma.event.create({
      data: {
        title,
        slug: generateSlug(title),
        description,
        location,
        city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: parseInt(capacity),
        categoryId,
        isFree: isFree ?? false,
        imageUrl: imageUrl ?? null,
        organizerId: req.user!.id,
        status: 'DRAFT',
      },
      include: { category: true, organizer: { select: { id: true, firstName: true, lastName: true } } },
    });

    return res.status(201).json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la creation de l evenement' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  const { search, category, city, dateFrom, dateTo, minPrice, maxPrice, page = '1', limit = '12' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  try {
    const where: any = { status: 'PUBLISHED' };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) where.categoryId = category as string;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = new Date(dateFrom as string);
      if (dateTo) where.startDate.lte = new Date(dateTo as string);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          category: true,
          organizer: { select: { id: true, firstName: true, lastName: true } },
          tickets: true,
          _count: { select: { attendees: true, reviews: true } },
        },
        orderBy: { startDate: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    return res.json({
      events,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la recuperation des evenements' });
  }
};

export const getEventBySlug = async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        category: true,
        organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        tickets: true,
        reviews: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { attendees: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evenement introuvable' });
    }

    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getMyEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user!.id },
      include: {
        category: true,
        tickets: true,
        _count: { select: { attendees: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Evenement introuvable' });
    }

    if (existing.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const data: any = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.capacity) data.capacity = parseInt(data.capacity);

    const event = await prisma.event.update({
      where: { id },
      data,
      include: { category: true },
    });

    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la mise a jour' });
  }
};

export const updateEventStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Evenement introuvable' });
    }

    if (existing.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    if (status === 'PUBLISHED' && req.user!.role !== 'ADMIN') {
      const organizer = await prisma.user.findUnique({ where: { id: existing.organizerId } });
      if (!organizer?.phoneVerified) {
        return res.status(403).json({ error: 'Verifie ton numero de telephone avant de publier un evenement' });
      }

      if (!organizer.trustedOrganizer && existing.moderationStatus === 'PENDING') {
        await prisma.event.update({ where: { id }, data: { status: 'DRAFT' } });
        return res.status(202).json({ message: 'Evenement soumis a la moderation. Un administrateur va le valider sous peu.' });
      }
    }

    const event = await prisma.event.update({ where: { id }, data: { status } });

    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Evenement introuvable' });
    }

    if (existing.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    await prisma.event.delete({ where: { id } });

    return res.json({ message: 'Evenement supprime avec succes' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
// ADMIN : liste des evenements en attente de moderation
export const getPendingEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { moderationStatus: 'PENDING' },
      include: { organizer: { select: { firstName: true, lastName: true, email: true, phoneVerified: true } }, category: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ADMIN : approuve ou rejette un evenement
export const moderateEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { decision } = req.body; // 'APPROVED' ou 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'Decision invalide' });
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        moderationStatus: decision,
        status: decision === 'APPROVED' ? 'PUBLISHED' : 'CANCELLED',
      },
    });

    // Marque l'organisateur comme "de confiance" apres sa premiere approbation
    if (decision === 'APPROVED') {
      await prisma.user.update({ where: { id: event.organizerId }, data: { trustedOrganizer: true } });
      await createNotification(
        event.organizerId,
        'Evenement approuve',
        `Ton evenement "${event.title}" a ete approuve et est maintenant publie.`
      );
    } else {
      await createNotification(
        event.organizerId,
        'Evenement rejete',
        `Ton evenement "${event.title}" a ete rejete par un administrateur.`
      );
    }

    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la moderation' });
  }
};
// Signalement d'un evenement par un participant
export const reportEvent = async (req: AuthRequest, res: Response) => {
  const { eventId, reason } = req.body;
  if (!eventId || !reason) return res.status(400).json({ error: 'Motif du signalement requis' });

  try {
    await prisma.report.create({ data: { eventId, userId: req.user!.id, reason } });

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { reportsCount: { increment: 1 } },
    });

    // Suspension automatique au-dela de 3 signalements
    if (updated.reportsCount >= 3 && updated.status === 'PUBLISHED') {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'DRAFT', moderationStatus: 'PENDING' },
      });
      await createNotification(
        updated.organizerId,
        'Evenement suspendu',
        `Ton evenement "${updated.title}" a ete suspendu suite a plusieurs signalements et repasse en moderation.`
      );
    }

    return res.status(201).json({ message: 'Signalement envoye, merci pour ta vigilance' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors du signalement' });
  }
};