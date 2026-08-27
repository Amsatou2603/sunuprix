"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { useAuth } from "@/lib/auth/AuthContext";
import { CarteRegions } from "@/components/donnees/CarteRegions";
import { CartesSynthese } from "@/components/donnees/CartesSynthese";
import { GraphiquePrix } from "@/components/donnees/GraphiquePrix";
import { SelecteurProduitRegion } from "@/components/donnees/SelecteurProduitRegion";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import { alertesApi } from "@/lib/api/alertes";
import type {
  Alerte,
  PointHistoriquePrix,
  PredictionPublique,
  Produit,
  Region,
  SnapshotRegion,
} from "@/lib/api/types";

function ContenuPageDonnees() {
  const { utilisateur } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [produitId, setProduitId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");

  const [carte, setCarte] = useState<SnapshotRegion[]>([]);
  const [historique, setHistorique] = useState<PointHistoriquePrix[]>([]);
  const [prediction, setPrediction] = useState<PredictionPublique | null>(null);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementReferentiel, setChargementReferentiel] = useState(true);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        setProduitId((actuel) => actuel || listeProduits[0]?.id || "");
        setRegionId((actuel) => actuel || listeRegions[0]?.id || "");
      })
      .catch(() => undefined)
      .finally(() => setChargementReferentiel(false));

    alertesApi
      .lister()
      .then(setAlertes)
      .catch(() => undefined);
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
      .catch(() => undefined)
      .finally(() => setChargement(false));
  }, [produitId, regionId]);

  const produitCourant = produits.find((p) => p.id === produitId);
  const regionCourante = regions.find((r) => r.id === regionId);

  const prenomUtilisateur = utilisateur?.nom ? utilisateur.nom.split(" ")[0] : "";

  // Région où le produit sélectionné a le plus varié ce mois-ci — calculé à partir des vrais relevés (pas de texte inventé).
  const regionPlusVariable = useMemo(() => {
    const avecVariation = carte.filter((s) => s.variationMensuellePourcent !== null);
    if (avecVariation.length === 0) return null;
    return avecVariation.reduce((max, s) =>
      Math.abs(s.variationMensuellePourcent as number) > Math.abs(max.variationMensuellePourcent as number) ? s : max
    );
  }, [carte]);

  const alertesActives = alertes.filter((a) => a.active);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        {/* Greeting Banner */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A]">
            Bonjour{prenomUtilisateur ? `, ${prenomUtilisateur}` : ""}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Voici un résumé des tendances du marché ce mois-ci.
          </p>
        </div>

        {/* 3 Top Highlight Cards — données réelles */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Prédiction du jour (réelle, déjà chargée pour le produit/région sélectionnés) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">
                🔮
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500">
                Prédiction — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
              </p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                {prediction ? `${prediction.prixPredit.toLocaleString("fr-FR")} FCFA` : "Indisponible"}
              </p>
              {prediction?.margeErreurFcfa != null && (
                <p className="mt-1 text-xs text-gray-400">± {Math.round(prediction.margeErreurFcfa)} FCFA</p>
              )}
            </div>
          </div>

          {/* Card 2: Alertes actives (réelles) */}
          <div className="rounded-2xl border-l-4 border-red-500 border-y border-r border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 text-lg">
                  ⚠️
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  {alertesActives.length} active{alertesActives.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500">Alertes de prix</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                {alertesActives[0] ? alertesActives[0].produit.nom : "Aucune"}
              </p>
              {alertesActives[0] && (
                <p className="mt-1 text-xs text-gray-400">
                  Seuil {alertesActives[0].seuilPourcent}% — {alertesActives[0].region.nom}
                </p>
              )}
            </div>
          </div>

          {/* Card 3: constat réel dérivé de la carte régionale du produit sélectionné */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white text-lg">
                  💡
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Constat
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-purple-200 uppercase tracking-wide">
                Variation la plus marquée ce mois-ci
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-purple-50">
                {regionPlusVariable
                  ? `${produitCourant?.nom ?? "Ce produit"} a varié de ${
                      (regionPlusVariable.variationMensuellePourcent as number) > 0 ? "+" : ""
                    }${(regionPlusVariable.variationMensuellePourcent as number).toFixed(1)}% à ${regionPlusVariable.region}.`
                  : "Pas encore assez de relevés pour dégager une tendance régionale."}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content: synthèse régionale + mes alertes (remplace le graphique statique et les "favoris" fictifs) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Synthèse par région — {produitCourant?.nom ?? "…"}</h2>
              <Link href="/chercheur" className="text-xs font-semibold text-[#00B493] hover:underline">
                Voir détails
              </Link>
            </div>
            <CartesSynthese snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Mes alertes</h2>
              <Link
                href="/alertes"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                aria-label="Gérer mes alertes"
              >
                +
              </Link>
            </div>

            {alertes.length === 0 ? (
              <EtatVide
                icone="🔔"
                titre="Aucune alerte"
                description="Créez une alerte pour suivre l'évolution d'un produit dans une région."
              />
            ) : (
              <div className="space-y-4">
                {alertes.slice(0, 5).map((alerte) => (
                  <div
                    key={alerte.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{alerte.produit.nom}</p>
                      <p className="text-[11px] text-gray-400">{alerte.region.nom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">Seuil {alerte.seuilPourcent}%</p>
                      <p className={`text-[10px] font-bold ${alerte.active ? "text-emerald-600" : "text-gray-400"}`}>
                        {alerte.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Interactive Region & Product Explorer */}
        <div className="pt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Exploration Approfondie par Région &amp; Produit
          </h2>
          {erreur && <MessageErreur message={erreur} />}

          {chargementReferentiel ? (
            <div className="carte">
              <Chargement libelle="Chargement du référentiel…" />
            </div>
          ) : (
            <div className="space-y-6">
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

              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="carte">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Carte Régionale — {produitCourant?.nom ?? "…"}
                  </h3>
                  <CarteRegions snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
                </div>

                <div className="carte">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Évolution — {produitCourant?.nom ?? "…"} à {regionCourante?.nom ?? "…"}
                    </h3>
                    {prediction && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
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
            </div>
          )}
        </div>
      </div>
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
