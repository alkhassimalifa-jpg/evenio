import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

// Scan d'un QR code pour valider l'entrée
export const scanQRCode = async (req: AuthRequest, res: Response) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({ error: 'Le code QR est requis' });
  }

  try {
    const attendee = await prisma.attendee.findUnique({
      where: { qrCode },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        event: { select: { id: true, title: true, organizerId: true } },
      },
    });

    if (!attendee) {
      return res.status(404).json({ error: 'Billet invalide ou introuvable', valid: false });
    }

    // Vérifie que celui qui scanne est bien l'organisateur de l'événement (ou admin)
    if (attendee.event.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    if (attendee.checkedIn) {
      return res.status(409).json({
        error: 'Ce billet a deja ete scanne',
        valid: false,
        checkedInAt: attendee.checkedInAt,
        attendee: { name: `${attendee.user.firstName} ${attendee.user.lastName}` },
      });
    }

    const updated = await prisma.attendee.update({
      where: { qrCode },
      data: { checkedIn: true, checkedInAt: new Date() },
    });

    return res.json({
      message: 'Entree validee avec succes',
      valid: true,
      attendee: {
        name: `${attendee.user.firstName} ${attendee.user.lastName}`,
        email: attendee.user.email,
        event: attendee.event.title,
        checkedInAt: updated.checkedInAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors du scan' });
  }
};

// Liste de présence en temps réel pour un événement
export const getAttendanceList = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evenement introuvable' });

    if (event.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const attendees = await prisma.attendee.findMany({
      where: { eventId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const total = attendees.length;
    const checkedIn = attendees.filter((a) => a.checkedIn).length;

    return res.json({
      stats: { total, checkedIn, remaining: total - checkedIn },
      attendees,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};