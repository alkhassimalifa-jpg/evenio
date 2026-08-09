import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

// Fonction utilitaire réutilisable dans les autres controllers (ex: order.controller)
export const createNotification = async (userId: string, title: string, message: string) => {
  return prisma.notification.create({ data: { userId, title, message } });
};

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'Toutes les notifications ont ete marquees comme lues' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};