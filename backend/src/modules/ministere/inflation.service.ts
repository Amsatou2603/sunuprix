import * as referentielRepository from "../referentiel/referentiel.repository";
import * as prixRepository from "../prix/prix.repository";
import { calculerVariationPourcent } from "../prix/prix.service";

export interface InflationRegion {
  regionId: string;
  region: string;
  inflationMoyennePourcent: number | null;
  nombreProduitsPrisEnCompte: number;
}

/**
 * Vue macro pour le Ministère : moyenne, par région, de la variation
 * mensuelle de prix (dernier relevé validé vs précédent) sur l'ensemble des
 * 12 produits suivis. Un produit sans historique suffisant dans une région
 * est simplement exclu de la moyenne de cette région plutôt que de la
 * fausser avec une valeur arbitraire.
 */
export async function calculerInflationParRegion(): Promise<InflationRegion[]> {
  const [regions, produits] = await Promise.all([
    referentielRepository.listerRegions(),
    referentielRepository.listerProduits(),
  ]);

  return Promise.all(
    regions.map(async (region): Promise<InflationRegion> => {
      const variations: number[] = [];

      for (const produit of produits) {
        const [dernier, precedent] = await prixRepository.trouverDeuxDerniersReleves(produit.id, region.id);
        if (!dernier || !precedent) continue;
        const variation = calculerVariationPourcent(dernier.prixFcfa, precedent.prixFcfa);
        if (variation !== null) variations.push(variation);
      }

      const inflationMoyennePourcent =
        variations.length === 0
          ? null
          : Math.round((variations.reduce((total, v) => total + v, 0) / variations.length) * 10) / 10;

      return {
        regionId: region.id,
        region: region.nom,
        inflationMoyennePourcent,
        nombreProduitsPrisEnCompte: variations.length,
      };
    }),
  );
}
