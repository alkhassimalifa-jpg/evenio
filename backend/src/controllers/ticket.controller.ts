import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { notifyWaitlistIfSpotsOpened } from './waitlist.controller';

// Verifie que l'utilisateur est bien proprietaire de l'evenement (ou admin)
const checkEventOwnership = async (eventId: string, userId: string, userRole: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, code: 404, message: 'Evenement introuvable' };
  if (event.organizerId !== userId && userRole !== 'ADMIN') {
    return { ok: false, code: 403, message: 'Acces refuse' };
  }
  return { ok: true, event };
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId } = req.params;
  const { name, type, price, quantity } = req.body;

  try {
    const check = await checkEventOwnership(eventId, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ error: check.message });

    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        name,
        type,
        price: parseFloat(price),
        quantity: parseInt(quantity),
      },
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la creation du billet' });
  }
};

export const getTicketsByEvent = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      orderBy: { price: 'asc' },
    });

    return res.json(tickets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Billet introuvable' });

    const check = await checkEventOwnership(ticket.eventId, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ error: check.message });

    const data: any = { ...req.body };
    if (data.price) data.price = parseFloat(data.price);
    if (data.quantity) data.quantity = parseInt(data.quantity);

    const oldQuantity = ticket.quantity;

    const updated = await prisma.ticket.update({ where: { id }, data });

    // Si la quantite disponible a augmente, on notifie la liste d'attente
    if (data.quantity && data.quantity > oldQuantity) {
      const newSpots = data.quantity - oldQuantity;
      await notifyWaitlistIfSpotsOpened(ticket.eventId, newSpots);
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la mise a jour' });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Billet introuvable' });

    const check = await checkEventOwnership(ticket.eventId, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ error: check.message });

    if (ticket.quantitySold > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer un billet deja vendu' });
    }

    await prisma.ticket.delete({ where: { id } });

    return res.json({ message: 'Billet supprime avec succes' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};