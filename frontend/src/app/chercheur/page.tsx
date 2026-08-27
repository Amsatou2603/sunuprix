"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { BoutonExportCsv } from "@/components/chercheur/BoutonExportCsv";
import { VueComparative } from "@/components/chercheur/VueComparative";
import { referentielApi } from "@/lib/api/referentiel";
import type { Produit, Region } from "@/lib/api/types";

interface ResultatComparaison {
  pointsDeDonnees: number;
  entitesComparees: number;
}

function ContenuPageChercheur() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [resultatComparaison, setResultatComparaison] = useState<ResultatComparaison | null>(null);

  useEffect(() => {
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-white py-8 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        {/* Page Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Dashboard Chercheur
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <BarChart3 className="h-4 w-4" strokeWidth={1.75} /> Analyse comparative des prix au Sénégal
            </p>
          </div>

          <BoutonExportCsv />
        </div>

        {/* 4 Metric KPI Cards — données réelles (référentiel + dernière analyse comparative) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Produits suivis</span>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-gray-900">{produits.length}</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Régions couvertes</span>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-gray-900">{regions.length}</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Points de données (dernière analyse)</span>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-gray-900">
                {resultatComparaison ? resultatComparaison.pointsDeDonnees : "—"}
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Entités comparées</span>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-gray-900">
                {resultatComparaison ? resultatComparaison.entitesComparees : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Outil d'analyse comparative réel (branché sur l'historique + les prédictions) */}
        <VueComparative onResultat={setResultatComparaison} />
      </div>
    </div>
  );
}

export default function PageChercheur() {
  return (
    <RouteProtegee rolesAutorises={["CHERCHEUR", "ADMIN"]}>
      <ContenuPageChercheur />
    </RouteProtegee>
  );
}
