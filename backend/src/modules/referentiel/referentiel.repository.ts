import { prisma } from "../../config/prisma";

/**
 * Accès en lecture aux listes fermées "régions" et "produits" telles que
 * peuplées en base par le seed. Les valeurs de référence (noms, unités, prix
 * de base) restent définies une seule fois dans `@sunuprix/shared` /
 * `prisma/seed.ts` — ce repository ne fait que les relire depuis la base.
 */

export function listerRegions() {
  return prisma.region.findMany({ orderBy: { nom: "asc" } });
}

export function listerProduits() {
  return prisma.produit.findMany({ orderBy: { nom: "asc" } });
}

export function trouverProduitParId(id: string) {
  return prisma.produit.findUnique({ where: { id } });
}

export function trouverRegionParId(id: string) {
  return prisma.region.findUnique({ where: { id } });
}
