import { z } from "zod";
import { ROLES_INSCRIPTIBLES } from "../../config/constants";

/**
 * Schémas de validation des entrées HTTP du module d'authentification.
 * Toute règle de validation vit ici, une seule fois — ni dans le contrôleur,
 * ni dans le service.
 */

export const schemaInscription = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  motDePasse: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  // ADMIN est exclu de l'inscription publique (créé uniquement par seed ou par un autre admin).
  role: z.enum(ROLES_INSCRIPTIBLES as [string, ...string[]], {
    errorMap: () => ({ message: `Le rôle doit être l'un de : ${ROLES_INSCRIPTIBLES.join(", ")}.` }),
  }),
});

export const schemaConnexion = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  motDePasse: z.string().min(1, "Le mot de passe est requis."),
});

// --------------------------------------------------------------------------
// Connexion avec Google (Google Identity Services)
// --------------------------------------------------------------------------

export const schemaGoogleConnexion = z.object({
  // Jeton d'identité (ID token) émis par Google côté navigateur — vérifié
  // côté serveur par google.service.ts, jamais fait confiance tel quel.
  idToken: z.string().min(10, "Jeton Google manquant ou invalide."),
});

// --------------------------------------------------------------------------
// Vérification par SMS (Twilio Verify) — numéros sénégalais uniquement,
// au format E.164 complet : +221 suivi de 9 chiffres (ex. +221771234567).
// --------------------------------------------------------------------------

const REGEX_TELEPHONE_SENEGAL = /^\+221[0-9]{9}$/;

export const schemaEnvoyerOtp = z.object({
  telephone: z
    .string()
    .trim()
    .regex(REGEX_TELEPHONE_SENEGAL, "Numéro sénégalais invalide. Format attendu : +221 7X XXX XX XX."),
});

export const schemaVerifierOtp = z.object({
  telephone: z
    .string()
    .trim()
    .regex(REGEX_TELEPHONE_SENEGAL, "Numéro sénégalais invalide. Format attendu : +221 7X XXX XX XX."),
  code: z.string().trim().regex(/^\d{4,8}$/, "Code de vérification invalide."),
  // Renseignés uniquement lors de la création d'un nouveau compte (première
  // connexion avec ce numéro) — absents pour une simple reconnexion.
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120).optional(),
  role: z
    .enum(ROLES_INSCRIPTIBLES as [string, ...string[]], {
      errorMap: () => ({ message: `Le rôle doit être l'un de : ${ROLES_INSCRIPTIBLES.join(", ")}.` }),
    })
    .optional(),
});

export type EntreeInscription = z.infer<typeof schemaInscription>;
export type EntreeConnexion = z.infer<typeof schemaConnexion>;
export type EntreeGoogleConnexion = z.infer<typeof schemaGoogleConnexion>;
export type EntreeEnvoyerOtp = z.infer<typeof schemaEnvoyerOtp>;
export type EntreeVerifierOtp = z.infer<typeof schemaVerifierOtp>;
