import { ApiError } from "../../utils/ApiError";
import * as prixRepository from "./prix.repository";
import type { RelevePrixAvecRelations, RelevePrixAvecVendeur } from "./prix.repository";
import * as referentielRepository from "../referentiel/referentiel.repository";
import type { DeclarationPrixPublique, PointHistoriquePrix, SnapshotRegion } from "./prix.types";

/** Variation en pourcentage entre deux valeurs, arrondie à une décimale. */
export function calculerVariationPourcent(valeurActuelle: number, valeurPrecedente: number): number | null {
  if (valeurPrecedente === 0) return null;
  return Math.round(((valeurActuelle - valeurPrecedente) / valeurPrecedente) * 1000) / 10;
}

export async function verifierProduitEtRegion(produitId: string, regionId: string): Promise<void> {
  const [produit, region] = await Promise.all([
    referentielRepository.trouverProduitParId(produitId),
    referentielRepository.trouverRegionParId(regionId),
  ]);
  if (!produit) throw ApiError.mauvaiseRequete("Produit introuvable.");
  if (!region) throw ApiError.mauvaiseRequete("Région introuvable.");
}

export async function obtenirHistorique(produitId: string, regionId: string): Promise<PointHistoriquePrix[]> {
  await verifierProduitEtRegion(produitId, regionId);
  const releves = await prixRepository.listerHistoriqueValide(produitId, regionId);
  return releves.map((r) => ({
    date: r.dateReleve.toISOString(),
    prixFcfa: r.prixFcfa,
    source: r.source,
  }));
}

export async function obtenirCarteParProduit(produitId: string): Promise<SnapshotRegion[]> {
  const produit = await referentielRepository.trouverProduitParId(produitId);
  if (!produit) throw ApiError.mauvaiseRequete("Produit introuvable.");

  const regions = await referentielRepository.listerRegions();

  return Promise.all(
    regions.map(async (region): Promise<SnapshotRegion> => {
      const [dernier, precedent] = await prixRepository.trouverDeuxDerniersReleves(produitId, region.id);
      return {
        regionId: region.id,
        region: region.nom,
        prixActuelFcfa: dernier?.prixFcfa ?? null,
        variationMensuellePourcent:
          dernier && precedent ? calculerVariationPourcent(dernier.prixFcfa, precedent.prixFcfa) : null,
        dateDernierReleve: dernier?.dateReleve.toISOString() ?? null,
      };
    }),
  );
}

function versDeclarationPublique(d: RelevePrixAvecRelations | RelevePrixAvecVendeur): DeclarationPrixPublique {
  return {
    id: d.id,
    produit: d.produit,
    region: d.region,
    prixFcfa: d.prixFcfa,
    statut: d.statut as DeclarationPrixPublique["statut"],
    dateReleve: d.dateReleve.toISOString(),
    creeLe: d.creeLe.toISOString(),
    modereLe: d.modereLe?.toISOString() ?? null,
    vendeur: "vendeur" in d ? (d.vendeur ?? undefined) : undefined,
  };
}

export async function declarerPrix(
  vendeurId: string,
  donnees: { produitId: string; regionId: string; prixFcfa: number; dateReleve: Date },
): Promise<DeclarationPrixPublique> {
  await verifierProduitEtRegion(donnees.produitId, donnees.regionId);
  if (donnees.prixFcfa <= 0) {
    throw ApiError.mauvaiseRequete("Le prix déclaré doit être strictement positif.");
  }

  const declaration = await prixRepository.creerDeclarationVendeur({
    produitId: donnees.produitId,
    regionId: donnees.regionId,
    prixFcfa: donnees.prixFcfa,
    dateReleve: donnees.dateReleve,
    vendeurId,
  });
  return versDeclarationPublique(declaration);
}

export async function listerMesDeclarations(vendeurId: string): Promise<DeclarationPrixPublique[]> {
  const declarations = await prixRepository.listerDeclarationsVendeur(vendeurId);
  return declarations.map(versDeclarationPublique);
}

export async function listerEnAttenteModeration(): Promise<DeclarationPrixPublique[]> {
  const declarations = await prixRepository.listerEnAttente();
  return declarations.map(versDeclarationPublique);
}

async function moderer(
  id: string,
  statut: "VALIDE" | "REJETE",
  moderateurId: string,
): Promise<DeclarationPrixPublique> {
  const existante = await prixRepository.trouverDeclarationParId(id);
  if (!existante) throw ApiError.introuvable("Déclaration introuvable.");
  if (existante.statut !== "EN_ATTENTE") {
    throw ApiError.conflit("Cette déclaration a déjà été traitée.");
  }
  const misAJour = await prixRepository.moderer(id, statut, moderateurId);
  return versDeclarationPublique(misAJour);
}

export function validerDeclaration(id: string, moderateurId: string) {
  return moderer(id, "VALIDE", moderateurId);
}

export function rejeterDeclaration(id: string, moderateurId: string) {
  return moderer(id, "REJETE", moderateurId);
}
