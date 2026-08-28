import type { Utilisateur } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { hacherMotDePasse, verifierMotDePasse } from "../../utils/motDePasse";
import { signerToken } from "../../utils/jwt";
import * as authRepository from "./auth.repository";
import * as googleService from "./google.service";
import * as otpService from "./otp.service";
import type { EntreeConnexion, EntreeInscription, EntreeVerifierOtp } from "./auth.schema";
import type { ResultatAuthentification, UtilisateurPublic } from "./auth.types";
import { ROLES, type Role } from "../../config/constants";

/**
 * Rôle attribué par défaut aux comptes créés via un flux "un clic" (Google
 * ou téléphone/OTP) : ces flux n'affichent volontairement pas de sélecteur
 * de rôle pour rester frictionless, contrairement au formulaire d'inscription
 * e-mail/mot de passe. `CONSOMMATEUR` est le rôle grand public de la plateforme.
 */
const ROLE_PAR_DEFAUT_INSCRIPTION_RAPIDE: Role = "CONSOMMATEUR";

/** Retire les champs sensibles avant tout envoi au client. */
function versUtilisateurPublic(utilisateur: Utilisateur): UtilisateurPublic {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
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
// Connexion avec Google
// --------------------------------------------------------------------------

export async function connecterAvecGoogle(idToken: string): Promise<ResultatAuthentification> {
  const profil = await googleService.verifierJetonGoogle(idToken);

  let utilisateur = await authRepository.trouverParGoogleId(profil.googleId);

  if (!utilisateur) {
    // Un compte existe peut-être déjà avec cet e-mail (inscrit au préalable
    // via e-mail/mot de passe) : on relie le compte Google à ce compte
    // existant plutôt que de créer un doublon en conflit sur l'e-mail unique.
    const existantParEmail = await authRepository.trouverParEmail(profil.email);
    utilisateur = existantParEmail
      ? await authRepository.lierGoogleId(existantParEmail.id, profil.googleId)
      : await authRepository.creerUtilisateurGoogle({
          nom: profil.nom,
          email: profil.email,
          googleId: profil.googleId,
          role: ROLE_PAR_DEFAUT_INSCRIPTION_RAPIDE,
        });
  }

  if (!utilisateur.actif) {
    throw ApiError.acceIntedit("Ce compte a été désactivé. Contactez un administrateur.");
  }

  const token = signerToken({ sub: utilisateur.id, role: utilisateur.role as Role, email: utilisateur.email });
  return { utilisateur: versUtilisateurPublic(utilisateur), token };
}

// --------------------------------------------------------------------------
// Vérification par SMS (Twilio Verify)
// --------------------------------------------------------------------------

export async function envoyerOtp(telephone: string): Promise<void> {
  await otpService.envoyerCodeOtp(telephone);
}

export async function verifierOtp(entree: EntreeVerifierOtp): Promise<ResultatAuthentification> {
  const codeValide = await otpService.verifierCodeOtp(entree.telephone, entree.code);
  if (!codeValide) {
    throw ApiError.mauvaiseRequete("Code de vérification incorrect ou expiré.");
  }

  let utilisateur = await authRepository.trouverParTelephone(entree.telephone);

  if (!utilisateur) {
    // Première connexion avec ce numéro : création du compte. Le nom est
    // fourni par le formulaire d'inscription téléphone à ce stade.
    if (!entree.nom) {
      throw ApiError.mauvaiseRequete("Votre nom est requis pour créer un compte.");
    }
    const role =
      entree.role && (ROLES as readonly string[]).includes(entree.role)
        ? (entree.role as Role)
        : ROLE_PAR_DEFAUT_INSCRIPTION_RAPIDE;

    utilisateur = await authRepository.creerUtilisateurTelephone({
      nom: entree.nom,
      telephone: entree.telephone,
      role,
    });
  }

  if (!utilisateur.actif) {
    throw ApiError.acceIntedit("Ce compte a été désactivé. Contactez un administrateur.");
  }

  const token = signerToken({ sub: utilisateur.id, role: utilisateur.role as Role, email: utilisateur.email });
  return { utilisateur: versUtilisateurPublic(utilisateur), token };
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
