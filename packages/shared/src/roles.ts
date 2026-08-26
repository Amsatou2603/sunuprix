/**
 * Rôles applicatifs de SunuPrix.
 *
 * Source unique de vérité : ce tableau est importé à la fois par le backend
 * (enum Prisma `RoleUtilisateur`, middleware de contrôle d'accès) et par le
 * frontend (sélecteur de rôle à l'inscription, garde de route par rôle).
 * Ne jamais recopier cette liste ailleurs dans le code.
 *
 * ADMIN n'est volontairement pas proposé à l'inscription publique : un compte
 * administrateur ne peut être créé que par le script de seed ou par un autre
 * administrateur (voir `ROLES_INSCRIPTIBLES`).
 */
export const ROLES = ["ADMIN", "CHERCHEUR", "MINISTERE", "VENDEUR", "CONSOMMATEUR"] as const;

export type Role = (typeof ROLES)[number];

/** Rôles qu'un visiteur peut choisir librement au moment de l'inscription. */
export const ROLES_INSCRIPTIBLES = ROLES.filter((role) => role !== "ADMIN") as Exclude<Role, "ADMIN">[];

/** Libellés lisibles (français) pour l'affichage dans l'interface. */
export const LIBELLES_ROLES: Record<Role, string> = {
  ADMIN: "Administrateur",
  CHERCHEUR: "Chercheur",
  MINISTERE: "Ministère",
  VENDEUR: "Vendeur",
  CONSOMMATEUR: "Consommateur",
};

export function estRoleValide(valeur: string): valeur is Role {
  return (ROLES as readonly string[]).includes(valeur);
}
