import type { Utilisateur } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { Role } from "../../config/constants";

/**
 * Accès aux données pour le module d'authentification. Seule couche
 * autorisée à parler directement à Prisma pour les utilisateurs — services
 * et contrôleurs passent systématiquement par ces fonctions.
 */

export function trouverParEmail(email: string): Promise<Utilisateur | null> {
  return prisma.utilisateur.findUnique({ where: { email } });
}

export function trouverParId(id: string): Promise<Utilisateur | null> {
  return prisma.utilisateur.findUnique({ where: { id } });
}

export function creerUtilisateur(donnees: {
  nom: string;
  email: string;
  motDePasseHash: string;
  role: Role;
}): Promise<Utilisateur> {
  return prisma.utilisateur.create({ data: donnees });
}

// --------------------------------------------------------------------------
// Connexion avec Google / vérification par téléphone (OTP Twilio)
// --------------------------------------------------------------------------

export function trouverParTelephone(telephone: string): Promise<Utilisateur | null> {
  return prisma.utilisateur.findUnique({ where: { telephone } });
}

export function trouverParGoogleId(googleId: string): Promise<Utilisateur | null> {
  return prisma.utilisateur.findUnique({ where: { googleId } });
}

export function creerUtilisateurGoogle(donnees: {
  nom: string;
  email: string;
  googleId: string;
  role: Role;
}): Promise<Utilisateur> {
  return prisma.utilisateur.create({ data: donnees });
}

export function creerUtilisateurTelephone(donnees: {
  nom: string;
  telephone: string;
  role: Role;
}): Promise<Utilisateur> {
  return prisma.utilisateur.create({ data: donnees });
}

/**
 * Relie un compte Google à un utilisateur existant (trouvé par e-mail) au
 * lieu de créer un doublon — cas d'un compte déjà inscrit par e-mail/mot de
 * passe qui utilise "Continuer avec Google" pour la première fois.
 */
export function lierGoogleId(id: string, googleId: string): Promise<Utilisateur> {
  return prisma.utilisateur.update({ where: { id }, data: { googleId } });
}

// Les fonctions ci-dessous sont utilisées par l'espace Administrateur
// (gestion des utilisateurs) — elles restent ici plutôt que dans un
// repository dédié pour ne pas disperser l'accès Prisma au modèle
// `Utilisateur` à travers plusieurs fichiers.

export function listerTous(): Promise<Utilisateur[]> {
  return prisma.utilisateur.findMany({ orderBy: { creeLe: "desc" } });
}

export function mettreAJourRole(id: string, role: Role): Promise<Utilisateur> {
  return prisma.utilisateur.update({ where: { id }, data: { role } });
}

export function mettreAJourStatutActif(id: string, actif: boolean): Promise<Utilisateur> {
  return prisma.utilisateur.update({ where: { id }, data: { actif } });
}
