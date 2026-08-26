"use client";

import { useState } from "react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { BoutonExportCsv } from "@/components/chercheur/BoutonExportCsv";
import { VueComparative } from "@/components/chercheur/VueComparative";

// Heatmap grid colors matching Image 2
const GRID_COLORS = [
  ["#FEE2E2", "#E0F2FE", "#CCFBF1", "#E5E7EB", "#EF4444"],
  ["#FEF3C7", "#E0F2FE", "#14B8A6", "#E5E7EB", "#CCFBF1"],
  ["#14B8A6", "#E5E7EB", "#B91C1C", "#E5E7EB", "#06B6D4"],
  ["#E5E7EB", "#E5E7EB", "#CCFBF1", "#FEE2E2", "#E5E7EB"],
  ["#FEF3C7", "#E5E7EB", "#E5E7EB", "#E5E7EB", "#E5E7EB"],
];

function ContenuPageChercheur() {
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState(false);

  const tableauDonnees = [
    {
      produit: "Riz Parfumé (50kg)",
      moyenne: "22,450",
      mediane: "22,500",
      ecartType: "850.4",
      ecartTypeColor: "text-red-500 font-semibold",
      distribFill: "bg-[#00B493]",
      zscore: "+3.2",
      zscoreColor: "text-red-600 font-bold",
      statutIcon: "🔴",
    },
    {
      produit: "Huile d'Arachide (1L)",
      moyenne: "1,200",
      mediane: "1,200",
      ecartType: "45.2",
      ecartTypeColor: "text-gray-700",
      distribFill: "bg-[#0B4736]",
      zscore: "+0.8",
      zscoreColor: "text-gray-700",
      statutIcon: "🟢",
    },
    {
      produit: "Sucre Poudre (1kg)",
      moyenne: "650",
      mediane: "625",
      ecartType: "112.8",
      ecartTypeColor: "text-purple-600 font-semibold",
      distribFill: "bg-purple-600",
      zscore: "-2.1",
      zscoreColor: "text-purple-600 font-medium",
      statutIcon: "🟣",
    },
  ];

  const donneesFiltrees = tableauDonnees.filter((item) =>
    item.produit.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        {/* Page Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Dashboard Chercheur
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <span>📅</span> Analyse des données : Q3 2024 (Sénégal)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltreActif(!filtreActif)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres Avancés
            </button>
            <BoutonExportCsv />
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-500">Indice de Volatilité</span>
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">14.2%</span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                ↑+2.1%
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-500">Points de Données (24h)</span>
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">1.2M</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                ⚡ Actif
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-500">Anomalies Détectées</span>
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">47</span>
              <span className="text-xs font-medium text-gray-400">
                En cours de révision
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-500">Précision Modèle AI</span>
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="mt-3 space-y-2">
              <span className="text-3xl font-extrabold text-gray-900">94.8%</span>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[94.8%] rounded-full bg-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Split 65% Chart & 35% Heatmap */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Chart Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Évolution des Prix &amp; Prévisions
              </h2>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Historique
                </span>
                <span className="rounded-md bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  Prédiction AI
                </span>
              </div>
            </div>

            {/* Custom SVG Line Chart matching Image 2 */}
            <div className="relative mt-6 h-64 w-full">
              <svg className="h-full w-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="40" y1="180" x2="580" y2="180" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Y-axis labels */}
                <text x="10" y="25" className="fill-gray-400 text-[10px] font-medium">High</text>
                <text x="10" y="105" className="fill-gray-400 text-[10px] font-medium">Med</text>
                <text x="10" y="185" className="fill-gray-400 text-[10px] font-medium">Low</text>

                {/* Historical Green Curve (Jan -> Mar) */}
                <path
                  d="M 40 140 C 120 180, 180 90, 280 100 T 400 130"
                  fill="none"
                  stroke="#0B5D48"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* AI Forecast Purple Segmented Line (Apr -> May) */}
                <path
                  d="M 400 130 C 440 145, 480 70, 570 70"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="8"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                />
              </svg>

              {/* X-axis Month Labels */}
              <div className="mt-2 flex justify-between px-8 text-xs font-medium text-gray-400">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span className="text-purple-600 font-semibold">Apr (Prév)</span>
                <span className="text-purple-600 font-semibold">May (Prév)</span>
              </div>
            </div>
          </div>

          {/* Right Heatmap Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Densité d&apos;Anomalies</h2>
                <span className="text-xs text-gray-400 cursor-pointer" title="Concentration spatiale des anomalies par région">ℹ</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Concentration spatiale des écarts de prix par région.
              </p>

              {/* 5x5 Heatmap Grid */}
              <div className="mt-6 grid grid-cols-5 gap-2">
                {GRID_COLORS.map((row, rIdx) =>
                  row.map((color, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className="h-9 w-full rounded-md transition hover:scale-105"
                      style={{ backgroundColor: color }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Heatmap Legend Bar */}
            <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
              <span>Faible</span>
              <div className="h-2 w-32 rounded-full bg-gradient-to-r from-red-100 via-teal-200 to-red-600" />
              <span>Élevée</span>
            </div>
          </div>
        </div>

        {/* Detailed Statistical Table */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Analyse Statistique Détaillée</h2>
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une entité..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#00B493] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-semibold">
                  <th className="py-3 px-4">PRODUIT / ENTITÉ</th>
                  <th className="py-3 px-4">MOYENNE (FCFA)</th>
                  <th className="py-3 px-4">MÉDIANE</th>
                  <th className="py-3 px-4">ÉCART-TYPE (Σ)</th>
                  <th className="py-3 px-4 text-center">DISTRIBUTION</th>
                  <th className="py-3 px-4">Z-SCORE MAX</th>
                  <th className="py-3 px-4 text-center">STATUT AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donneesFiltrees.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-4 font-bold text-gray-900">{row.produit}</td>
                    <td className="py-4 px-4 font-medium text-gray-700">{row.moyenne}</td>
                    <td className="py-4 px-4 font-medium text-gray-700">{row.mediane}</td>
                    <td className={`py-4 px-4 ${row.ecartTypeColor}`}>{row.ecartType}</td>
                    <td className="py-4 px-4">
                      {/* Distribution Mini Graphic Bar */}
                      <div className="mx-auto flex h-3 w-28 items-center rounded-full bg-gray-200 px-1">
                        <div className={`h-full w-12 rounded-full ${row.distribFill} mx-auto`} />
                      </div>
                    </td>
                    <td className={`py-4 px-4 ${row.zscoreColor}`}>{row.zscore}</td>
                    <td className="py-4 px-4 text-center text-base">{row.statutIcon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Comparison Tool section embedded */}
        <div className="mt-8">
          <VueComparative />
        </div>
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

