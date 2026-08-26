import { ApiError } from "../../utils/ApiError";
import * as prixRepository from "../prix/prix.repository";
import { verifierProduitEtRegion } from "../prix/prix.service";
import * as predictionsRepository from "./predictions.repository";
import { calculerRegressionLineairePonderee, predireValeur } from "./regression.service";
import type { PredictionPublique } from "./predictions.types";

const METHODE_PREDICTION = "regression_lineaire_ponderee";

/**
 * Calcule une prédiction à partir de l'historique de prix validé d'un couple
 * produit/région, et la persiste (upsert) dans `Prediction`. Recalculée à
 * chaque appel de l'endpoint : bon marché (une régression sur au plus
 * quelques dizaines de points) et garantit une prédiction toujours à jour
 * par rapport aux derniers relevés validés (y compris des déclarations
 * vendeur récemment approuvées).
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
  const resultat = calculerRegressionLineairePonderee(points);

  const prochainIndice = points.length;
  const prixPredit = Math.max(0, Math.round(predireValeur(resultat, prochainIndice)));
  const margeErreurFcfa = Math.round(resultat.margeErreur);

  const dernierReleve = historique[historique.length - 1];
  const dateCible = new Date(dernierReleve.dateReleve.getFullYear(), dernierReleve.dateReleve.getMonth() + 1, 1);

  const prediction = await predictionsRepository.upsertPrediction({
    produitId,
    regionId,
    dateCible,
    prixPredit,
    margeErreurFcfa,
    methode: METHODE_PREDICTION,
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
