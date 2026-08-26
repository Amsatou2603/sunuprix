import type { Role } from "../../config/constants";

/** Représentation publique d'un utilisateur, jamais de mot de passe ni de hash. */
export interface UtilisateurPublic {
  id: string;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
  creeLe: string;
}

export interface ResultatAuthentification {
  utilisateur: UtilisateurPublic;
  token: string;
}
