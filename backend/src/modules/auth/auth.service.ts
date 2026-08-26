import type { Utilisateur } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { hacherMotDePasse, verifierMotDePasse } from "../../utils/motDePasse";
import { signerToken } from "../../utils/jwt";
import * as authRepository from "./auth.repository";
import type { EntreeConnexion, EntreeInscription } from "./auth.schema";
import type { ResultatAuthentification, UtilisateurPublic } from "./auth.types";
import { ROLES, type Role } from "../../config/constants";

/** Retire les champs sensibles avant tout envoi au client. */
function versUtilisateurPublic(utilisateur: Utilisateur): UtilisateurPublic {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    email: utilisateur.email,
    role: utilisateur.role as Role,
    actif: utilisateur.actif,
    creeLe: utilisateur.creeLe.toISOString(),
  };
}

export async function inscrire(entree: EntreeInscription): Promise<ResultatAuthentification> {
  const existant = await authRepository.trouverParEmail(entree.email);
  if (existant) {
    throw ApiError.conflit("Un compte existe déjà avec cette adresse e-mail.");
  }

  const motDePasseHash = await hacherMotDePasse(entree.motDePasse);
  const utilisateur = await authRepository.creerUtilisateur({
    nom: entree.nom,
    email: entree.email,
    motDePasseHash,
    role: entree.role as Role,
  });

  const token = signerToken({ sub: utilisateur.id, role: utilisateur.role as Role, email: utilisateur.email });
  return { utilisateur: versUtilisateurPublic(utilisateur), token };
}

export async function connecter(entree: EntreeConnexion): Promise<ResultatAuthentification> {
  const utilisateur = await authRepository.trouverParEmail(entree.email);
  if (!utilisateur) {
    throw ApiError.mauvaiseRequete("Identifiants incorrects.");
  }

  if (!utilisateur.actif) {
    throw ApiError.acceIntedit("Ce compte a été désactivé. Contactez un administrateur.");
  }

  const motDePasseValide = await verifierMotDePasse(entree.motDePasse, utilisateur.motDePasseHash);
  if (!motDePasseValide) {
    throw ApiError.mauvaiseRequete("Identifiants incorrects.");
  }

  const token = signerToken({ sub: utilisateur.id, role: utilisateur.role as Role, email: utilisateur.email });
  return { utilisateur: versUtilisateurPublic(utilisateur), token };
}

export async function obtenirProfilCourant(id: string): Promise<UtilisateurPublic> {
  const utilisateur = await authRepository.trouverParId(id);
  if (!utilisateur) {
    throw ApiError.introuvable("Utilisateur introuvable.");
  }
  return versUtilisateurPublic(utilisateur);
}

// --------------------------------------------------------------------------
// Gestion des utilisateurs (espace Administrateur)
// --------------------------------------------------------------------------

export async function listerUtilisateurs(): Promise<UtilisateurPublic[]> {
  const utilisateurs = await authRepository.listerTous();
  return utilisateurs.map(versUtilisateurPublic);
}

export async function changerRole(id: string, nouveauRole: string, adminCourantId: string): Promise<UtilisateurPublic> {
  if (!(ROLES as readonly string[]).includes(nouveauRole)) {
    throw ApiError.mauvaiseRequete(`Rôle invalide. Valeurs acceptées : ${ROLES.join(", ")}.`);
  }
  if (id === adminCourantId && nouveauRole !== "ADMIN") {
    throw ApiError.mauvaiseRequete("Vous ne pouvez pas retirer votre propre rôle d'administrateur.");
  }
  const cible = await authRepository.trouverParId(id);
  if (!cible) throw ApiError.introuvable("Utilisateur introuvable.");

  const misAJour = await authRepository.mettreAJourRole(id, nouveauRole as Role);
  return versUtilisateurPublic(misAJour);
}

export async function changerStatutActif(id: string, actif: boolean, adminCourantId: string): Promise<UtilisateurPublic> {
  if (id === adminCourantId && !actif) {
    throw ApiError.mauvaiseRequete("Vous ne pouvez pas désactiver votre propre compte.");
  }
  const cible = await authRepository.trouverParId(id);
  if (!cible) throw ApiError.introuvable("Utilisateur introuvable.");

  const misAJour = await authRepository.mettreAJourStatutActif(id, actif);
  return versUtilisateurPublic(misAJour);
}
