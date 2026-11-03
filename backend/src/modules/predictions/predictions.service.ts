import { ApiError } from "../../utils/ApiError";
import * as prixRepository from "../prix/prix.repository";
import { verifierProduitEtRegion } from "../prix/prix.service";
import * as predictionsRepository from "./predictions.repository";
import { genererPrediction, predireValeur } from "./lissage-exponentiel.service";
import type { PredictionPublique } from "./predictions.types";

/**
 * Calcule une prédiction à partir de l'historique de prix validé d'un couple
 * produit/région, et la persiste (upsert) dans `Prediction`. Recalculée à
 * chaque appel de l'endpoint : bon marché (lissage exponentiel sur au plus
 * quelques dizaines de points, pas d'entraînement itératif coûteux — la
 * recherche en grille des coefficients optimaux reste une opération locale
 * en mémoire) et garantit une prédiction toujours à jour par rapport aux
 * derniers relevés validés (y compris des déclarations contributeur
 * récemment approuvées).
 *
 * Méthode : lissage exponentiel de Holt-Winters (niveau + tendance +
 * saisonnalité mensuelle) si l'historique couvre au moins deux cycles
 * complets de 12 points, avec secours automatique vers un lissage
 * exponentiel double (Holt, sans saisonnalité) sinon — voir
 * `lissage-exponentiel.service.ts` pour le détail et la justification de ce
 * choix (remplace l'ancienne régression linéaire pondérée, voir mémoire de
 * PFE, chapitre Données).
 */
export async function calculerEtPersisterPrediction(produitId: string, regionId: string): Promise<PredictionPublique> {
  await verifierProduitEtRegion(produitId, regionId);

  const historique = await prixRepository.listerHistoriqueValide(produitId, regionId);
  if (historique.length < 2) {
    throw ApiError.mauvaiseRequete(
      "Historique insuffisant pour générer une prédiction (au moins 2 relevés validés sont nécessaires).",
    );
  }

  const points = historique.map((releve, indice) => ({ x: indice, y: releve.prixFcfa }));
  const resultat = genererPrediction(points);

  const indiceProchainPoint = points.length; // points.length - 1 + 1 (un pas en avant)
  const prixPredit = Math.max(0, Math.round(predireValeur(resultat, 1, indiceProchainPoint)));
  const margeErreurFcfa = Math.round(resultat.margeErreur);

  const dernierReleve = historique[historique.length - 1];
  const dateCible = new Date(dernierReleve.dateReleve.getFullYear(), dernierReleve.dateReleve.getMonth() + 1, 1);

  const methode =
    resultat.methode === "HOLT_WINTERS_ADDITIF" ? "lissage_exponentiel_holt_winters" : "lissage_exponentiel_double";

  const prediction = await predictionsRepository.upsertPrediction({
    produitId,
    regionId,
    dateCible,
    prixPredit,
    margeErreurFcfa,
    methode,
  });

  return {
    id: prediction.id,
    produitId: prediction.produitId,
    regionId: prediction.regionId,
    dateCible: prediction.dateCible.toISOString(),
    prixPredit: prediction.prixPredit,
    margeErreurFcfa: prediction.margeErreurFcfa,
    methode: prediction.methode,
    genereLe: prediction.genereLe.toISOString(),
  };
}
