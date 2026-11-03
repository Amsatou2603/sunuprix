import { TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import type { PointHistoriquePrix, PredictionPublique, Produit, Region } from "@/lib/api/types";

interface ProprietesInterpretationPrediction {
  produit: Produit | undefined;
  region: Region | undefined;
  historique: PointHistoriquePrix[];
  prediction: PredictionPublique | null;
}

/**
 * Traduit la prédiction brute (un prix + une marge d'erreur) en une phrase
 * lisible : direction, variation attendue, prix cible et marge d'erreur.
 * Volontairement limitée à la prédiction elle-même (ni méthode ni mises en
 * garde techniques), pour rester immédiatement compréhensible.
 */
export function InterpretationPrediction({ produit, region, historique, prediction }: ProprietesInterpretationPrediction) {
  if (!prediction || historique.length === 0) {
    return (
      <div className="carte">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-header/30" strokeWidth={1.75} />
          <p className="text-sm text-header/60">
            Pas encore assez de relevés validés pour {produit?.nom ?? "ce produit"} à{" "}
            {region?.nom ?? "cette région"} pour générer une prédiction interprétable.
          </p>
        </div>
      </div>
    );
  }

  const dernierPoint = historique[historique.length - 1];
  const variationAbsolue = prediction.prixPredit - dernierPoint.prixFcfa;
  const variationPourcent = dernierPoint.prixFcfa > 0 ? (variationAbsolue / dernierPoint.prixFcfa) * 100 : 0;
  const SEUIL_STABLE_POURCENT = 0.5;

  let direction: "hausse" | "baisse" | "stable" = "stable";
  if (variationPourcent > SEUIL_STABLE_POURCENT) direction = "hausse";
  else if (variationPourcent < -SEUIL_STABLE_POURCENT) direction = "baisse";

  const dateCibleLisible = new Date(prediction.dateCible).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const Icone = direction === "hausse" ? TrendingUp : direction === "baisse" ? TrendingDown : Minus;
  const couleur = direction === "hausse" ? "text-amber-600 bg-amber-50" : direction === "baisse" ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100";

  return (
    <div className="carte space-y-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${couleur}`}>
          <Icone className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-header">Interprétation de la prédiction</h3>
          <p className="text-xs text-header/50">
            {produit?.nom ?? "Produit"} à {region?.nom ?? "région"} — {dateCibleLisible}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-header/80">
        D&apos;après le dernier relevé validé ({dernierPoint.prixFcfa.toLocaleString("fr-FR")} FCFA/
        {produit?.unite ?? "unité"}), le modèle de prédiction estime que le prix{" "}
        {direction === "stable" ? (
          <>devrait rester globalement <strong>stable</strong></>
        ) : (
          <>
            devrait{" "}
            <strong>{direction === "hausse" ? "augmenter" : "baisser"}</strong> d&apos;environ{" "}
            <strong>
              {Math.abs(variationPourcent).toFixed(1)}%
            </strong>
          </>
        )}{" "}
        pour atteindre <strong>{prediction.prixPredit.toLocaleString("fr-FR")} FCFA</strong>
        {prediction.margeErreurFcfa != null && (
          <> (marge d&apos;erreur estimée à ± {Math.round(prediction.margeErreurFcfa)} FCFA)</>
        )}
        .
      </p>
    </div>
  );
}
