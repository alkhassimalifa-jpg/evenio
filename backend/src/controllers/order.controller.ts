import { Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateQRCodeImage } from '../services/qrcode.service';
import { createNotification } from './notification.controller';
export const createOrder = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId, items } = req.body;
  const userId = req.user!.id;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evenement introuvable' });
    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Cet evenement n\'est pas ouvert aux inscriptions' });
    }

    // Vérifie la disponibilité de chaque billet et calcule le total
    let totalAmount = 0;
    const ticketChecks: { ticketId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const ticket = await prisma.ticket.findUnique({ where: { id: item.ticketId } });
      if (!ticket || ticket.eventId !== eventId) {
        return res.status(404).json({ error: `Billet introuvable: ${item.ticketId}` });
      }
      const available = ticket.quantity - ticket.quantitySold;
      if (item.quantity > available) {
        return res.status(400).json({ error: `Stock insuffisant pour le billet "${ticket.name}" (${available} restant(s))` });
      }
      totalAmount += Number(ticket.price) * item.quantity;
      ticketChecks.push({ ticketId: ticket.id, quantity: item.quantity, price: Number(ticket.price) });
    }

    // Transaction : commande + items + décrément stock + paiement simulé + participants + QR
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          eventId,
          totalAmount,
          status: 'PAID', // Paiement simulé - à remplacer par PENDING avec vraie intégration Stripe
          items: {
            create: ticketChecks.map((t) => ({
              ticketId: t.ticketId,
              quantity: t.quantity,
              unitPrice: t.price,
            })),
          },
        },
        include: { items: true },
      });

      // Incrémente les ventes de chaque billet
      for (const t of ticketChecks) {
        await tx.ticket.update({
          where: { id: t.ticketId },
          data: { quantitySold: { increment: t.quantity } },
        });
      }

      // Paiement simulé
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: 'STRIPE',
          status: 'SUCCESS',
          amount: totalAmount,
          transactionId: `SIMULATED-${uuidv4()}`,
        },
      });

      // Génère un participant (attendee) avec QR code unique par billet acheté
      const attendees = [];
      for (const t of ticketChecks) {
        for (let i = 0; i < t.quantity; i++) {
          const qrData = uuidv4();
          const attendee = await tx.attendee.create({
            data: {
              userId,
              eventId,
              orderId: order.id,
              qrCode: qrData,
            },
          });
          attendees.push(attendee);
        }
      }

      return { order, attendees };
    });

    // Génère les images QR (hors transaction, pas besoin d'être atomique)
    const attendeesWithQR = await Promise.all(
      result.attendees.map(async (a) => ({
        id: a.id,
        qrCode: a.qrCode,
        qrImage: await generateQRCodeImage(a.qrCode),
      }))
    );

    await createNotification(
      userId,
      'Reservation confirmee',
      `Ta commande pour "${event.title}" a ete confirmee. Retrouve tes billets dans "Mes billets".`
    );

    return res.status(201).json({
      message: 'Commande confirmee avec succes',
      order: result.order,
      attendees: attendeesWithQR,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la creation de la commande' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        event: { select: { title: true, slug: true, startDate: true, imageUrl: true, city: true } },
        items: { include: { ticket: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: true,
        items: { include: { ticket: true } },
        payment: true,
        attendees: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Cette commande est deja annulee' });
    }

    await prisma.$transaction(async (tx) => {
      // Remet le stock disponible
      for (const item of order.items) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { quantitySold: { decrement: item.quantity } },
        });
      }

      await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });

      const payment = await tx.payment.findUnique({ where: { orderId: id } });
      if (payment) {
        await tx.payment.update({ where: { orderId: id }, data: { status: 'REFUNDED' } });
      }
    });

    return res.json({ message: 'Commande annulee avec succes' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
};