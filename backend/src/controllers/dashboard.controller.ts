import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

// Statistiques globales de l'organisateur (tous ses événements)
// Statistiques globales de l'organisateur (tous ses événements)
export const getOrganizerStats = async (req: AuthRequest, res: Response) => {
  const organizerId = req.user!.id;
  const ESCROW_DELAY_HOURS = 48;

  try {
    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        tickets: true,
        orders: { where: { status: 'PAID' } },
        _count: { select: { attendees: true, reviews: true } },
      },
    });

    let totalRevenue = 0;
    let totalAvailable = 0;
    let totalPending = 0;
    let totalTicketsSold = 0;
    let totalCapacity = 0;

    const now = new Date();

    const eventStats = events.map((e) => {
      const revenue = e.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const ticketsSold = e.tickets.reduce((sum, t) => sum + t.quantitySold, 0);
      totalRevenue += revenue;
      totalTicketsSold += ticketsSold;
      totalCapacity += e.capacity;

      // Escrow : le revenu devient disponible 48h apres la fin de l'evenement
      const unlockDate = new Date(e.endDate.getTime() + ESCROW_DELAY_HOURS * 60 * 60 * 1000);
      const isUnlocked = now >= unlockDate;
      const availableRevenue = isUnlocked ? revenue : 0;
      const pendingRevenue = isUnlocked ? 0 : revenue;

      totalAvailable += availableRevenue;
      totalPending += pendingRevenue;

      return {
        id: e.id,
        title: e.title,
        status: e.status,
        capacity: e.capacity,
        ticketsSold,
        fillRate: e.capacity > 0 ? Math.round((ticketsSold / e.capacity) * 100) : 0,
        revenue,
        availableRevenue,
        pendingRevenue,
        unlockDate: isUnlocked ? null : unlockDate,
        attendeesCount: e._count.attendees,
        reviewsCount: e._count.reviews,
      };
    });

    return res.json({
      summary: {
        totalEvents: events.length,
        totalRevenue,
        totalAvailable,
        totalPending,
        totalTicketsSold,
        globalFillRate: totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0,
      },
      events: eventStats,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Export CSV de la liste des participants d'un événement
export const exportAttendeesCSV = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evenement introuvable' });

    if (event.organizerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const attendees = await prisma.attendee.findMany({
      where: { eventId },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const header = 'Prenom,Nom,Email,Telephone,Statut,DateInscription,DateCheckin\n';
    const rows = attendees.map((a) => {
      const statut = a.checkedIn ? 'Present' : 'Non scanne';
      const dateCheckin = a.checkedInAt ? a.checkedInAt.toISOString() : '';
      return `${a.user.firstName},${a.user.lastName},${a.user.email},${a.user.phone || ''},${statut},${a.createdAt.toISOString()},${dateCheckin}`;
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${event.slug}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de l export' });
  }
};