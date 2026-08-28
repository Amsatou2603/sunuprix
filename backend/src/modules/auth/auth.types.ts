import type { Role } from "../../config/constants";

/** Représentation publique d'un utilisateur, jamais de mot de passe ni de hash. */
export interface UtilisateurPublic {
  id: string;
  nom: string;
  // Null pour un compte créé uniquement via téléphone/OTP.
  email: string | null;
  // Non-null uniquement pour un compte créé ou vérifié via l'OTP SMS Twilio.
  telephone: string | null;
  role: Role;
  actif: boolean;
  creeLe: string;
}

export interface ResultatAuthentification {
  utilisateur: UtilisateurPublic;
  token: string;
}
