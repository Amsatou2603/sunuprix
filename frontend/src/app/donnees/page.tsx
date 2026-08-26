"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { useAuth } from "@/lib/auth/AuthContext";
import { CarteRegions } from "@/components/donnees/CarteRegions";
import { CartesSynthese } from "@/components/donnees/CartesSynthese";
import { GraphiquePrix } from "@/components/donnees/GraphiquePrix";
import { SelecteurProduitRegion } from "@/components/donnees/SelecteurProduitRegion";
import { Chargement, MessageErreur } from "@/components/partages/EtatAsync";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import type {
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

  const prenomUtilisateur = utilisateur?.nom ? utilisateur.nom.split(" ")[0] : "Aminata";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        {/* Greeting Banner matching Image 5 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A]">
              Bonjour, {prenomUtilisateur}
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Voici un résumé de vos économies et des tendances du marché ce mois-ci.
            </p>
          </div>

          <select className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            <option>📅 Ce Mois</option>
            <option>📅 Mois Dernier</option>
          </select>
        </div>

        {/* 3 Top Highlight Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Économies Réalisées */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">
                  🐷
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  +12% vs mois dernier
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500">Économies Réalisées</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">24,500 FCFA</p>
            </div>
          </div>

          {/* Card 2: Alertes Inflation (Red accent left border) */}
          <div className="rounded-2xl border-l-4 border-red-500 border-y border-r border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 text-lg">
                  ⚠️
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  3 Nouveaux
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500">Alertes Inflation</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">Riz &amp; Huile</p>
            </div>
          </div>

          {/* Card 3: AI Insight (Purple gradient background) */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white text-lg">
                  💡
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  AI Insight
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-purple-200 uppercase tracking-wide">
                Recommandation
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-purple-50">
                Achetez l&apos;huile de palme au Marché Kermel aujourd&apos;hui. Les prix sont prévus d&apos;augmenter de 5% ce week-end.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Split: 60% Inter-Market Comparison & 40% Favorites */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Chart Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Comparaison Inter-Marchés</h2>
              <Link href="/chercheur" className="text-xs font-semibold text-[#00B493] hover:underline">
                Voir détails
              </Link>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs font-bold text-gray-700 mb-2">
                Évolution des Prix Moyens du Riz (2023-2024)
              </p>

              {/* Chart visualization matching Image 5 */}
              <div className="relative h-56 w-full">
                <svg className="h-full w-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Y-axis values */}
                  <text x="5" y="35" className="fill-gray-400 text-[9px]">20000</text>
                  <text x="5" y="85" className="fill-gray-400 text-[9px]">15000</text>
                  <text x="5" y="135" className="fill-gray-400 text-[9px]">10000</text>

                  {/* Actual Teal Line */}
                  <path
                    d="M 40 130 Q 100 110, 160 100 T 280 85 T 380 55"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="3"
                  />

                  {/* Forecast Purple Dotted Line */}
                  <path
                    d="M 380 55 Q 420 55, 470 50"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />

                  {/* Tooltip Pill */}
                  <rect x="340" y="30" width="100" height="22" rx="4" fill="#00C49F" />
                  <text x="350" y="44" className="fill-white text-[9px] font-bold">Sep 2024: 18,450 XOF</text>
                </svg>

                {/* X-axis months */}
                <div className="flex justify-between px-6 text-[10px] font-medium text-gray-400">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Favorites List */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Favoris</h2>
              <button className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                +
              </button>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                    🌾
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Riz Parfumé (50kg)</p>
                    <p className="text-[11px] text-gray-400">Marché Sandaga</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">22,000 F</p>
                  <p className="text-[10px] font-bold text-emerald-600">↓2%</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                    🍾
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Huile d&apos;Arachide (5L)</p>
                    <p className="text-[11px] text-gray-400">Auchan Mermoz</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">6,500 F</p>
                  <p className="text-[10px] font-bold text-red-600">↑1%</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    🥛
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Lait Entier (1L)</p>
                    <p className="text-[11px] text-gray-400">Casino Plateau</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">1,200 F</p>
                  <p className="text-[10px] font-bold text-gray-400">—0%</p>
                </div>
              </div>
            </div>
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

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Synthèse par Région
                </h3>
                <CartesSynthese snapshots={carte} regionSelectionneeId={regionId} onSelectionner={setRegionId} />
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

