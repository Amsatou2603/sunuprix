"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { TableauUtilisateurs } from "@/components/admin/TableauUtilisateurs";
import { FileModeration } from "@/components/admin/FileModeration";
import { ConfigurationSeuilsForm } from "@/components/admin/ConfigurationSeuilsForm";
import { adminApi } from "@/lib/api/admin";
import type { DeclarationPrixPublique, UtilisateurPublic } from "@/lib/api/types";

function ContenuPageAdmin() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurPublic[]>([]);
  const [declarations, setDeclarations] = useState<DeclarationPrixPublique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState<"VUE_DENSEMBLE" | "UTILISATEURS" | "MODERATION" | "CONFIG">("VUE_DENSEMBLE");

  useEffect(() => {
    Promise.all([adminApi.utilisateurs(), adminApi.declarationsEnAttente()])
      .then(([listeUtilisateurs, listeDeclarations]) => {
        setUtilisateurs(listeUtilisateurs);
        setDeclarations(listeDeclarations);
      })
      .catch(() => undefined)
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-gray-900">
      {/* ==================== LEFT SIDEBAR NAVIGATION ==================== */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          {/* Logo + Admin Badge */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/design/icon.svg" alt="SunuPrix Logo" width={34} height={34} />
              <span className="font-serif text-xl font-bold text-[#0B4736]">
                Sunu<span className="text-[#04281E]">Prix</span>
              </span>
            </Link>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              Admin
            </span>
          </div>

          {/* MENU PRINCIPAL */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              MENU PRINCIPAL
            </p>

            <button
              onClick={() => setOngletActif("VUE_DENSEMBLE")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                ongletActif === "VUE_DENSEMBLE"
                  ? "bg-gray-100 text-[#0B4736]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📊</span>
                Vue d&apos;ensemble
              </div>
            </button>

            <button
              onClick={() => setOngletActif("UTILISATEURS")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                ongletActif === "UTILISATEURS"
                  ? "bg-gray-100 text-[#0B4736]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">👥</span>
                Utilisateurs (1.2M)
              </div>
            </button>

            <button
              onClick={() => setOngletActif("VUE_DENSEMBLE")}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🏪</span>
                Boutiques &amp; Marchés
              </div>
            </button>

            <button
              onClick={() => setOngletActif("MODERATION")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                ongletActif === "MODERATION"
                  ? "bg-gray-100 text-[#0B4736]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚖️</span>
                Validations Prix
              </div>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                42
              </span>
            </button>
          </div>

          {/* SYSTÈME & IA */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              SYSTÈME &amp; IA
            </p>

            <Link
              href="/chatbot"
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="text-base text-purple-600">🤖</span>
              Centre IA SunuBot
            </Link>

            <button
              onClick={() => setOngletActif("VUE_DENSEMBLE")}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="text-base">🖥️</span>
              Santé Serveurs
            </button>

            <button
              onClick={() => setOngletActif("CONFIG")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                ongletActif === "CONFIG"
                  ? "bg-gray-100 text-[#0B4736]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">⚙️</span>
              Configuration
            </button>
          </div>
        </div>

        {/* Profile Footer */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00B493] text-xs font-bold text-white shadow-sm">
            AS
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Admin Suprême</p>
            <p className="text-[10px] font-medium text-gray-400">Niveau d&apos;accès: 5</p>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A]">
              Centre de Contrôle National
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Supervision en temps réel du réseau SunuPrix Sénégal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition">
              <span>📄</span> Rapport
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#0B5D48] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#074737] transition">
              <span>+</span> Action Rapide
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">
                👥
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                📈 +12%
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Utilisateurs Actifs</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">1,245,892</p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-lg">
                📋
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                📈 +5.4%
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Prix Validés (24h)</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">84,520</p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg">
                💻
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                Stable
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Santé Serveurs</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">99.98% <span className="text-xs font-normal text-gray-400">Uptime</span></p>
          </div>

          {/* Card 4 (RED LEFT ACCENT BORDER) */}
          <div className="rounded-2xl border-l-4 border-red-500 border-y border-r border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 text-lg">
                📢
              </div>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                Action Requise
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Signalements &amp; Litiges</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">42</p>
          </div>
        </div>

        {/* Middle Section: Split 65% Chart & 35% AI Insights */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Network Activity Bar Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Activité Réseau Nationale</h2>
              <select className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                <option>Aujourd&apos;hui</option>
                <option>Cette semaine</option>
              </select>
            </div>

            {/* 7-Bar Chart matching Image 3 */}
            <div className="flex h-52 items-end justify-between gap-3 px-4 pt-4">
              <div className="w-full rounded-t-lg bg-teal-200 h-[35%]" />
              <div className="w-full rounded-t-lg bg-teal-300 h-[55%]" />
              <div className="w-full rounded-t-lg bg-teal-200 h-[28%]" />
              <div className="w-full rounded-t-lg bg-teal-400 h-[75%]" />
              <div className="w-full rounded-t-lg bg-teal-200 h-[45%]" />
              <div className="w-full rounded-t-lg bg-[#0B5D48] h-[92%]" />
              <div className="w-full rounded-t-lg bg-teal-400 h-[65%]" />
            </div>
          </div>

          {/* AI Insights & Regional Map Card */}
          <div className="space-y-6 lg:col-span-4">
            {/* AI Insights Panel */}
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-purple-600 text-lg">⚙️</span>
                <span className="text-xs font-bold text-purple-600">AI Intelligence</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
                  <span className="text-purple-600 text-base">💡</span>
                  <div>
                    <p className="font-bold text-gray-900">Tendance à la hausse détectée</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">
                      Le prix de l&apos;oignon local augmente de 15% plus vite que la normale dans la région de Thiès. Recommandation: Alerte de surveillance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
                  <span className="text-emerald-600 text-base">🛡️</span>
                  <div>
                    <p className="font-bold text-gray-900">Score de Fiabilité Global</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">
                      Le taux de confiance des prix soumis par la communauté est stable à 92% cette semaine.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/chatbot"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-100/80 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-200 transition"
              >
                💬 Interroger SunuBot
              </Link>
            </div>

            {/* Regional Activity map preview snippet */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-900 mb-2">Activité Régionale</p>
              <div className="h-28 w-full rounded-xl bg-emerald-950/10 p-3 flex flex-col justify-end text-[10px] text-gray-600">
                <p className="font-bold text-emerald-900">MATAM REGION · TAMBACOUNDA REGION</p>
                <p className="text-gray-500">Boki Sada · Belel Diamala</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Community Validations List */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900">
              Validations Communautaires Récentes
            </h2>
            <button onClick={() => setOngletActif("MODERATION")} className="text-xs font-semibold text-[#00B493] hover:underline">
              Voir tout
            </button>
          </div>

          <div className="space-y-4">
            {/* Item 1 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/50 transition">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                  🌾
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Riz Brisé Parfumé (Sac 50kg)</p>
                  <p className="text-[11px] text-gray-500">Marché Sandaga, Dakar · Soumis il y a 5 min</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">22,500 FCFA</p>
                  <p className="text-[10px] font-semibold text-emerald-600">12 Confirmations</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition">✓</button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition">✕</button>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/50 transition">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                  🍾
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Huile Végétale (Bidon 20L)</p>
                  <p className="text-[11px] text-gray-500">Marché Castors, Dakar · Soumis il y a 12 min</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">19,000 FCFA</p>
                  <p className="text-[10px] font-semibold text-red-600 flex items-center gap-1">⚠️ Écart suspect détecté</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition">✓</button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab specific views for User Management, File Moderation, and Config */}
        {ongletActif === "UTILISATEURS" && (
          <div className="mt-8">
            <TableauUtilisateurs
              utilisateurs={utilisateurs}
              chargement={chargement}
              onUtilisateurMisAJour={(utilisateur) =>
                setUtilisateurs((prev) => prev.map((u) => (u.id === utilisateur.id ? utilisateur : u)))
              }
            />
          </div>
        )}

        {ongletActif === "MODERATION" && (
          <div className="mt-8">
            <FileModeration
              declarations={declarations}
              chargement={chargement}
              onDeclarationTraitee={(id) => setDeclarations((prev) => prev.filter((d) => d.id !== id))}
            />
          </div>
        )}

        {ongletActif === "CONFIG" && (
          <div className="mt-8">
            <ConfigurationSeuilsForm />
          </div>
        )}
      </main>
    </div>
  );
}

export default function PageAdmin() {
  return (
    <RouteProtegee rolesAutorises={["ADMIN"]}>
      <ContenuPageAdmin />
    </RouteProtegee>
  );
}

