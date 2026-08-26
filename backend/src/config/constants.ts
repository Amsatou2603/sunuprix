/**
 * Réexport des constantes partagées (`@sunuprix/shared`) sous un chemin
 * d'import stable côté backend. Ne redéfinit jamais ces valeurs : toute liste
 * fermée (rôles, régions, produits) vit dans le package partagé.
 */
export { ROLES, ROLES_INSCRIPTIBLES, LIBELLES_ROLES, estRoleValide } from "@sunuprix/shared";
export type { Role } from "@sunuprix/shared";
export { REGIONS } from "@sunuprix/shared";
export type { NomRegion } from "@sunuprix/shared";
export { PRODUITS, NOMS_PRODUITS } from "@sunuprix/shared";
export type { NomProduit, DefinitionProduit } from "@sunuprix/shared";

/** Nom du cookie httpOnly utilisé pour transporter le JWT de session. */
export const NOM_COOKIE_SESSION = "sunuprix_session";

/**
 * Seuils par défaut du système d'alerte (variation de prix mois sur mois),
 * utilisés uniquement pour créer paresseusement la ligne singleton
 * `ConfigurationSeuils` si elle n'existe pas encore en base — la valeur
 * effective, éventuellement modifiée par un administrateur, est ensuite
 * toujours lue depuis la base de données (jamais depuis cette constante).
 */
export const SEUIL_ATTENTION_POURCENT_DEFAUT = 5;
export const SEUIL_CRITIQUE_POURCENT_DEFAUT = 10;

/** Nombre de mois d'historique utilisés par le moteur de régression. */
export const NB_MOIS_REGRESSION = 12;
