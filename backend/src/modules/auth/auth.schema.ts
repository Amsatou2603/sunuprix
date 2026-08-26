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

export type EntreeInscription = z.infer<typeof schemaInscription>;
export type EntreeConnexion = z.infer<typeof schemaConnexion>;
