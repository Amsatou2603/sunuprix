import { prisma } from "../../config/prisma";

/**
 * Comptages agrégés, non sensibles (aucune donnée nominative), utilisés
 * uniquement pour afficher des chiffres réels sur la page d'accueil —
 * y compris pour un visiteur non connecté. Jamais de valeur recopiée en dur
 * côté frontend : tout vient d'ici.
 */
export async function compterStatsPubliques() {
  const [produits, regions, relevesPrix] = await Promise.all([
    prisma.produit.count(),
    prisma.region.count(),
    prisma.relevePrix.count(),
  ]);

  return { produits, regions, relevesPrix };
}
