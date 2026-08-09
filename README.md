# Evenio - Plateforme de gestion d'evenements

Plateforme complete de gestion et billetterie d'evenements (type Eventbrite), avec paiement, controle d'acces par QR code, tableau de bord organisateur, et systeme anti-fraude.

## Fonctionnalites

### Pour les participants
- Recherche et decouverte d'evenements (filtres par ville, categorie, date)
- Reservation de billets avec paiement (simule pour la demo)
- Billets electroniques avec QR code unique
- Avis et notation post-evenement
- Liste d'attente automatique si un evenement est complet
- Notifications en temps reel (reservation confirmee, etc.)
- Signalement d'evenements suspects

### Pour les organisateurs
- Creation et gestion d'evenements
- Gestion des types de billets (Standard, VIP, Early Bird...)
- Tableau de bord avec statistiques (revenus, taux de remplissage, ventes)
- Export CSV de la liste des participants
- Scanner de controle d'acces (camera en temps reel ou saisie manuelle)
- Systeme d'escrow : revenus disponibles 48h apres la fin de l'evenement

### Anti-fraude
- Verification obligatoire du numero de telephone avant publication
- Moderation admin du premier evenement de chaque nouvel organisateur
- Signalement communautaire avec suspension automatique (3+ signalements)
- Statut "organisateur de confiance" apres validation

### Administration
- Gestion des utilisateurs (roles, suppression)
- Moderation des evenements en attente
- Vue d'ensemble complete de la plateforme

## Stack technique

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT pour l'authentification
- bcrypt pour le hash des mots de passe
- Generation de QR codes (librairie `qrcode`)

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand pour la gestion d'etat
- Scanner QR via camera (`html5-qrcode`)

## Comptes de demonstration

| Role | Email / Telephone | Mot de passe |
|---|---|---|
| Administrateur | jean@test.com | 123456 |
| Organisateur | awa@test.com | 123456 |
| Participant | fatou@test.com | 123456 |

*L'inscription supporte egalement la connexion par numero de telephone uniquement, sans email (a la maniere de WhatsApp/Facebook).*

## Installation locale

### Prerequis
- Node.js 20+
- PostgreSQL 16+

### 1. Cloner le depot

```bash
git clone https://github.com/alkhassimalifa-jpg/evenio.git
cd evenio
```

### 2. Configurer le backend

```bash
cd backend
npm install
```

Cree un fichier `.env` a la racine du dossier `backend` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gestion_evenements"
JWT_SECRET="votre_secret_jwt"
JWT_EXPIRES_IN="7d"
PORT=5000
```

Applique les migrations et lance le serveur :

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

Le backend tourne sur `http://localhost:5000`.

### 3. Configurer le frontend

```bash
cd ../frontend
npm install
```

Cree un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Le frontend tourne sur `http://localhost:3000`.

## Notes sur la demo

- Le paiement est **simule** (aucune vraie carte bancaire n'est debitee) - une integration Stripe est prevue pour une mise en production.
- La verification par SMS est **simulee** : le code de verification s'affiche directement a l'ecran au lieu d'etre envoye par un vrai SMS.

## Auteur

Projet developpe par [alkhassimalifa-jpg](https://github.com/alkhassimalifa-jpg)
