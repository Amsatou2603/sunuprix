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
 *
 * Historique : le rôle MINISTERE a été retiré (voir mémoire de PFE, chapitre
 * Données) — présenté en perspective plutôt que livré, faute de source de
 * données officielle vérifiable. Le rôle VENDEUR a été renommé CONTRIBUTEUR :
 * le mécanisme sous-jacent (déclaration -> file d'attente -> validation par
 * un administrateur) est inchangé, seul le cadrage change — un contributeur
 * signale un prix constaté sur le terrain, il ne "vend" rien sur la
 * plateforme. Le rôle CHERCHEUR a ensuite été renommé ANALYSTE, à la
 * demande du formateur référent : la fonction (comparaison multi-régions/
 * produits avec diagnostic généré par IA) est inchangée, seul le nom du
 * rôle change — "Analyste" désigne plus précisément ce que fait ce rôle
 * dans l'application (analyser des données déjà collectées) que
 * "Chercheur", qui évoque plutôt une activité de recherche scientifique.
 */
export const ROLES = ["ADMIN", "ANALYSTE", "CONTRIBUTEUR", "CONSOMMATEUR"] as const;

export type Role = (typeof ROLES)[number];

/** Rôles qu'un visiteur peut choisir librement au moment de l'inscription. */
export const ROLES_INSCRIPTIBLES = ROLES.filter((role) => role !== "ADMIN") as Exclude<Role, "ADMIN">[];

/** Libellés lisibles (français) pour l'affichage dans l'interface. */
export const LIBELLES_ROLES: Record<Role, string> = {
  ADMIN: "Administrateur",
  ANALYSTE: "Analyste",
  CONTRIBUTEUR: "Contributeur",
  CONSOMMATEUR: "Consommateur",
};

export function estRoleValide(valeur: string): valeur is Role {
  return (ROLES as readonly string[]).includes(valeur);
}
