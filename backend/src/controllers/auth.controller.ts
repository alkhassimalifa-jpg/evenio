import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { generateToken } from '../utils/jwt.util';

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, phone, password, role } = req.body;

  try {
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ error: 'Cet email est deja utilise' });
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ error: 'Ce numero de telephone est deja utilise' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const allowedRoles = ['PARTICIPANT', 'ORGANIZER'];
    const finalRole = allowedRoles.includes(role) ? role : 'PARTICIPANT';

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: finalRole,
      },
    });

    const token = generateToken({ id: user.id, role: user.role, email: user.email || undefined });

    return res.status(201).json({
      message: 'Compte cree avec succes',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la creation du compte' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identifier, password } = req.body;

  try {
    const isEmail = identifier.includes('@');

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { phone: identifier } });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = generateToken({ id: user.id, role: user.role, email: user.email || undefined });

    return res.json({
      message: 'Connexion reussie',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
        phoneVerified: true,
        trustedOrganizer: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
 
// Genere un code OTP (simule un envoi SMS - a brancher sur un vrai service plus tard)
export const sendPhoneOtp = async (req: any, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Le numero de telephone est requis' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { phone, phoneOtp: otp, phoneOtpExpiresAt: expiresAt },
  });

  // MODE DEMO : le code est renvoye directement dans la reponse.
  // En production, il faudrait l'envoyer par un vrai service SMS (Twilio, etc.) et ne jamais le renvoyer ici.
  return res.json({ message: 'Code envoye (mode demo)', demoOtp: otp });
};

export const verifyPhoneOtp = async (req: any, res: Response) => {
  const { otp } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !user.phoneOtp || !user.phoneOtpExpiresAt) {
    return res.status(400).json({ error: 'Aucun code en attente' });
  }
  if (new Date() > user.phoneOtpExpiresAt) {
    return res.status(400).json({ error: 'Code expire, redemande un code' });
  }
  if (user.phoneOtp !== otp) {
    return res.status(400).json({ error: 'Code incorrect' });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { phoneVerified: true, phoneOtp: null, phoneOtpExpiresAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, phoneVerified: true },
  });

  return res.json({ message: 'Telephone verifie avec succes', user: updated });
};