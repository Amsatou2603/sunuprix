"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { CarteRegions } from "@/components/donnees/CarteRegions";
import { CartesSynthese } from "@/components/donnees/CartesSynthese";
import { GraphiquePrix } from "@/components/donnees/GraphiquePrix";
import { SelecteurProduitRegion } from "@/components/donnees/SelecteurProduitRegion";
import { InterpretationPrediction } from "@/components/donnees/InterpretationPrediction";
import { TableauHistorique } from "@/components/donnees/TableauHistorique";
import { Chargement, MessageErreur } from "@/components/partages/EtatAsync";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import type { PointHistoriquePrix, PredictionPublique, Produit, Region, SnapshotRegion } from "@/lib/api/types";

/**
 * Page de détails Données — corrige le lien "Voir détails" de /donnees qui
 * renvoyait jusqu'ici vers /analyste (ex-/chercheur), une page réservée au
 * rôle Analyste : un Consommateur ou un Contributeur cliquant dessus était
 * silencieusement renvoyé à l'accueil par la garde de rôle, sans aucune
 * explication (bug remonté par le formateur référent). Cette page est, comme
 * /donnees elle-même, accessible à tout rôle authentifié (pas de
 * `rolesAutorises` sur `RouteProtegee`) : elle n'est pas l'outil d'analyse
 * comparative réservé à l'Analyste, mais le détail — filtres clairs,
 * historique complet et prédiction interprétée en phrases, pas seulement en
 * chiffre — du couple produit/région déjà affiché en synthèse sur /donnees.
 */
function ContenuDetailsDonnees() {
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const produitInitial = searchParams.get("produit") ?? "";
    const regionInitiale = searchParams.get("region") ?? "";

    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        setProduitId(produitInitial || listeProduits[0]?.id || "");
        setRegionId(regionInitiale || listeRegions[0]?.id || "");
      })
      .catch(() => setErreur("Impossible de charger les régions et produits."))
      .finally(() => setChargementReferentiel(false));
    // Lu une seule fois au montage : les filtres changent ensuite librement sans retoucher l'URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!produitId) return;
    prixApi
      .carte(produitId)
      .then(setCarte)
      .catch(() => undefined);
  }, [produitId]);

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
      .catch(() => setErreur("Impossible de charger l'historique de ce produit dans cette région."))
      .finally(() => setChargement(false));
  }, [produitId, regionId]);

  const produitCourant = produits.find((p) => p.id === produitId);
  const regionCourante = regions.find((r) => r.id === regionId);

  return (
    <div className="min-h-screen bg-white py-8 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
        <div>
          <Link href="/donnees" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Retour à Données
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
            Détails — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Historique complet, comparaison régionale et prédiction interprétée pour ce produit.
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

            <div className="carte">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Comparaison régionale — {produitCourant?.nom ?? "…"}
              </h2>
              <CartesSynthese snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
              <div className="carte">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Carte régionale</h2>
                <CarteRegions snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
              </div>

              <div className="carte">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Évolution — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
                </h2>
                {chargement ? (
                  <Chargement libelle="Chargement de l'historique…" />
                ) : (
                  <GraphiquePrix historique={historique} prediction={prediction} unite={produitCourant?.unite ?? ""} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {chargement ? (
                <div className="carte">
                  <Chargement libelle="Calcul de la prédiction…" />
                </div>
              ) : (
                <InterpretationPrediction
                  produit={produitCourant}
                  region={regionCourante}
                  historique={historique}
                  prediction={prediction}
                />
              )}

              <div className="carte">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Détail des relevés — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
                </h2>
                {chargement ? (
                  <Chargement libelle="Chargement de l'historique…" compact />
                ) : (
                  <TableauHistorique historique={historique} unite={produitCourant?.unite ?? ""} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PageDetailsDonnees() {
  return (
    <RouteProtegee>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Chargement libelle="Chargement…" />
          </div>
        }
      >
        <ContenuDetailsDonnees />
      </Suspense>
    </RouteProtegee>
  );
}
