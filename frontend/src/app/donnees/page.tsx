"use client";

import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { CarteRegions } from "@/components/donnees/CarteRegions";
import { CartesSynthese } from "@/components/donnees/CartesSynthese";
import { GraphiquePrix } from "@/components/donnees/GraphiquePrix";
import { SelecteurProduitRegion } from "@/components/donnees/SelecteurProduitRegion";
import { Chargement, MessageErreur } from "@/components/partages/EtatAsync";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import { ErreurApi } from "@/lib/api/api-client";
import type {
  PointHistoriquePrix,
  PredictionPublique,
  Produit,
  Region,
  SnapshotRegion,
} from "@/lib/api/types";

function ContenuPageDonnees() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [produitId, setProduitId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");

  const [carte, setCarte] = useState<SnapshotRegion[]>([]);
  const [historique, setHistorique] = useState<PointHistoriquePrix[]>([]);
  const [prediction, setPrediction] = useState<PredictionPublique | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementReferentiel, setChargementReferentiel] = useState(true);
  const [chargement, setChargement] = useState(true);

  // Chargement initial du référentiel — sert à peupler les sélecteurs et à
  // choisir des valeurs par défaut, jamais codées en dur.
  useEffect(() => {
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        setProduitId((actuel) => actuel || listeProduits[0]?.id || "");
        setRegionId((actuel) => actuel || listeRegions[0]?.id || "");
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger le référentiel."))
      .finally(() => setChargementReferentiel(false));
  }, []);

  // Carte régionale : recalculée à chaque changement de produit.
  useEffect(() => {
    if (!produitId) return;
    prixApi
      .carte(produitId)
      .then(setCarte)
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger la carte."));
  }, [produitId]);

  // Historique + prédiction : recalculés à chaque changement de produit ou de région.
  useEffect(() => {
    if (!produitId || !regionId) return;
    setChargement(true);
    setErreur(null);

    Promise.all([
      prixApi.historique(produitId, regionId),
      predictionsApi.obtenir(produitId, regionId).catch(() => null),
    ])
      .then(([donneesHistorique, donneesPrediction]) => {
        setHistorique(donneesHistorique);
        setPrediction(donneesPrediction);
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger l'historique."))
      .finally(() => setChargement(false));
  }, [produitId, regionId]);

  const produitCourant = produits.find((p) => p.id === produitId);
  const regionCourante = regions.find((r) => r.id === regionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Données de marché</h1>
        <p className="mt-1 text-sm text-header/60">
          Prix suivis dans les 5 régions pour les 12 produits de consommation de SunuPrix, avec prédiction du mois
          suivant.
        </p>
      </div>

      {erreur && <MessageErreur message={erreur} />}

      {chargementReferentiel ? (
        <div className="carte">
          <Chargement libelle="Chargement du référentiel…" />
        </div>
      ) : (
        <>
          <div className="carte">
            <SelecteurProduitRegion
              produits={produits}
              regions={regions}
              produitId={produitId}
              regionId={regionId}
              onChangerProduit={setProduitId}
              onChangerRegion={setRegionId}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="carte">
              <h2 className="text-sm font-semibold text-header/70">Carte régionale — {produitCourant?.nom ?? "…"}</h2>
              <CarteRegions snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
            </div>

            <div className="carte">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-header/70">
                  Évolution — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
                </h2>
                {prediction && (
                  <span className="badge-hausse">
                    Prédit : {prediction.prixPredit.toLocaleString("fr-FR")} FCFA
                    {prediction.margeErreurFcfa != null ? ` (± ${Math.round(prediction.margeErreurFcfa)})` : ""}
                  </span>
                )}
              </div>
              {chargement ? (
                <Chargement libelle="Chargement de l'historique…" />
              ) : (
                <GraphiquePrix historique={historique} prediction={prediction} unite={produitCourant?.unite ?? ""} />
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-header/70">Synthèse par région</h2>
            <CartesSynthese snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
          </div>
        </>
      )}
    </div>
  );
}

export default function PageDonnees() {
  return (
    <RouteProtegee>
      <ContenuPageDonnees />
    </RouteProtegee>
  );
}
