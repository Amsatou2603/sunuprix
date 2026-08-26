import { prisma } from "../../config/prisma";
import type { RelevePrix, SourcePrix, StatutPrix } from "@prisma/client";

/**
 * Forme exacte d'un `RelevePrix` renvoyé par les requêtes ci-dessous qui
 * incluent produit/région (`INCLUSION_PRODUIT_REGION`) — annotée
 * explicitement plutôt que laissée à l'inférence, pour que les couches
 * service/contrôleur au-dessus n'aient jamais à deviner la forme réelle.
 */
export type RelevePrixAvecRelations = RelevePrix & {
  produit: { id: string; nom: string; unite: string };
  region: { id: string; nom: string };
};

export type RelevePrixAvecVendeur = RelevePrixAvecRelations & {
  vendeur: { id: string; nom: string; email: string } | null;
};

/**
 * Seul point d'accès Prisma pour les relevés de prix (`RelevePrix`). Toute
 * requête impliquant ce modèle — historique pour un graphique, snapshot pour
 * la carte, déclaration vendeur, file de modération, export CSV — passe par
 * ces fonctions, réutilisées à travers les modules `prix`, `predictions`,
 * `admin`, `ministere` et `export` plutôt que dupliquées.
 */

const INCLUSION_PRODUIT_REGION = {
  produit: { select: { id: true, nom: true, unite: true } },
  region: { select: { id: true, nom: true } },
} as const;

export function listerHistoriqueValide(produitId: string, regionId: string) {
  return prisma.relevePrix.findMany({
    where: { produitId, regionId, statut: "VALIDE" as StatutPrix },
    orderBy: { dateReleve: "asc" },
  });
}

/** Les deux derniers relevés validés (pour calculer une variation mensuelle) d'un couple produit/région. */
export async function trouverDeuxDerniersReleves(produitId: string, regionId: string) {
  return prisma.relevePrix.findMany({
    where: { produitId, regionId, statut: "VALIDE" as StatutPrix },
    orderBy: { dateReleve: "desc" },
    take: 2,
  });
}

export async function creerDeclarationVendeur(donnees: {
  produitId: string;
  regionId: string;
  prixFcfa: number;
  dateReleve: Date;
  vendeurId: string;
}): Promise<RelevePrixAvecRelations> {
  const releve = await prisma.relevePrix.create({
    data: {
      produitId: donnees.produitId,
      regionId: donnees.regionId,
      prixFcfa: donnees.prixFcfa,
      dateReleve: donnees.dateReleve,
      vendeurId: donnees.vendeurId,
      source: "VENDEUR" as SourcePrix,
      statut: "EN_ATTENTE" as StatutPrix,
    },
    include: INCLUSION_PRODUIT_REGION,
  });
  return releve as unknown as RelevePrixAvecRelations;
}

export async function listerDeclarationsVendeur(vendeurId: string): Promise<RelevePrixAvecRelations[]> {
  const releves = await prisma.relevePrix.findMany({
    where: { vendeurId },
    orderBy: { creeLe: "desc" },
    include: INCLUSION_PRODUIT_REGION,
  });
  return releves as unknown as RelevePrixAvecRelations[];
}

export async function listerEnAttente(): Promise<RelevePrixAvecVendeur[]> {
  const releves = await prisma.relevePrix.findMany({
    where: { statut: "EN_ATTENTE" as StatutPrix },
    orderBy: { creeLe: "asc" },
    include: {
      ...INCLUSION_PRODUIT_REGION,
      vendeur: { select: { id: true, nom: true, email: true } },
    },
  });
  return releves as unknown as RelevePrixAvecVendeur[];
}

export function trouverDeclarationParId(id: string) {
  return prisma.relevePrix.findUnique({ where: { id } });
}

export async function moderer(
  id: string,
  statut: Extract<StatutPrix, "VALIDE" | "REJETE">,
  moderateurId: string,
): Promise<RelevePrixAvecRelations> {
  const releve = await prisma.relevePrix.update({
    where: { id },
    data: { statut, moderateurId, modereLe: new Date() },
    include: INCLUSION_PRODUIT_REGION,
  });
  return releve as unknown as RelevePrixAvecRelations;
}

interface FiltresExport {
  produitId?: string;
  regionId?: string;
}

export async function listerPourExport(filtres: FiltresExport): Promise<RelevePrixAvecRelations[]> {
  const releves = await prisma.relevePrix.findMany({
    where: {
      statut: "VALIDE" as StatutPrix,
      produitId: filtres.produitId,
      regionId: filtres.regionId,
    },
    orderBy: [{ produitId: "asc" }, { regionId: "asc" }, { dateReleve: "asc" }],
    include: INCLUSION_PRODUIT_REGION,
  });
  return releves as unknown as RelevePrixAvecRelations[];
}

/** Dernier relevé validé de chaque région pour un produit (agrégation utilisée par /inflation et la carte). */
export function listerDerniersReleveesParProduit(produitId: string) {
  return prisma.relevePrix.findMany({
    where: { produitId, statut: "VALIDE" as StatutPrix },
    orderBy: { dateReleve: "desc" },
  });
}

export { INCLUSION_PRODUIT_REGION };
