"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { TableauUtilisateurs } from "@/components/admin/TableauUtilisateurs";
import { FileModeration } from "@/components/admin/FileModeration";
import { ConfigurationSeuilsForm } from "@/components/admin/ConfigurationSeuilsForm";
import { adminApi } from "@/lib/api/admin";
import { referentielApi } from "@/lib/api/referentiel";
import { telechargerExportCsv } from "@/lib/api/export";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import type { DeclarationPrixPublique, Produit, Region, UtilisateurPublic } from "@/lib/api/types";

function ContenuPageAdmin() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurPublic[]>([]);
  const [declarations, setDeclarations] = useState<DeclarationPrixPublique[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState<"VUE_DENSEMBLE" | "UTILISATEURS" | "MODERATION" | "CONFIG">("VUE_DENSEMBLE");
  const [enCoursExport, setEnCoursExport] = useState(false);
  const [idEnCoursApercu, setIdEnCoursApercu] = useState<string | null>(null);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.utilisateurs(), adminApi.declarationsEnAttente()])
      .then(([listeUtilisateurs, listeDeclarations]) => {
        setUtilisateurs(listeUtilisateurs);
        setDeclarations(listeDeclarations);
      })
      .catch(() => undefined)
      .finally(() => setChargement(false));

    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
      })
      .catch(() => undefined);
  }, []);

  const exporterRapport = async () => {
    setEnCoursExport(true);
    try {
      await telechargerExportCsv();
    } catch {
      // Le bouton reste silencieux en cas d'échec ponctuel ; l'export complet reste disponible côté Chercheur.
    } finally {
      setEnCoursExport(false);
    }
  };

  const traiterDeclarationApercu = async (id: string, action: "valider" | "rejeter") => {
    setIdEnCoursApercu(id);
    setErreurApercu(null);
    try {
      await (action === "valider" ? adminApi.validerDeclaration(id) : adminApi.rejeterDeclaration(id));
      setDeclarations((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setErreurApercu(e instanceof ErreurApi ? e.message : "Impossible de traiter cette déclaration.");
    } finally {
      setIdEnCoursApercu(null);
    }
  };

  const utilisateursActifs = utilisateurs.filter((u) => u.actif).length;
  const repartitionRoles = ROLES.map((role) => ({
    role,
    libelle: LIBELLES_ROLES[role],
    total: utilisateurs.filter((u) => u.role === role).length,
  }));
  const maxParRole = Math.max(1, ...repartitionRoles.map((r) => r.total));

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
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
                Utilisateurs ({utilisateurs.length})
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
              {declarations.length > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {declarations.length}
                </span>
              )}
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
              <Image src="/design/sunubot-icon.svg" alt="SunuBot Icon" width={20} height={20} />
              Centre IA SunuBot
            </Link>

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
            <p className="text-xs font-bold text-gray-900">Administrateur</p>
            <p className="text-[10px] font-medium text-gray-400">SunuPrix Sénégal</p>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A]">
              Centre de Contrôle
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Supervision du réseau SunuPrix Sénégal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exporterRapport}
              disabled={enCoursExport}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span>📄</span> {enCoursExport ? "Export…" : "Rapport (CSV)"}
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards — données réelles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">
              👥
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Utilisateurs Actifs</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {utilisateursActifs} <span className="text-xs font-normal text-gray-400">/ {utilisateurs.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-lg">
              📋
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Déclarations en attente</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{declarations.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg">
              🏷️
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Produits suivis</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{produits.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg">
              🗺️
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Régions couvertes</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{regions.length}</p>
          </div>
        </div>

        {/* Middle Section: répartition réelle des rôles & aperçu de modération */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Répartition des utilisateurs par rôle (calculée à partir des vrais comptes) */}
          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-6 shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Répartition des utilisateurs par rôle</h2>
            </div>

            <div className="flex h-52 items-end justify-between gap-3 px-4 pt-4">
              {repartitionRoles.map(({ role, libelle, total }) => (
                <div key={role} className="flex w-full flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-[#0B5D48]"
                    style={{ height: `${Math.max(4, (total / maxParRole) * 100)}%` }}
                    title={`${libelle} : ${total}`}
                  />
                  <span className="text-center text-[10px] font-medium text-gray-500">{libelle}</span>
                  <span className="text-xs font-bold text-gray-900">{total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu réel : déclarations en attente + régions couvertes */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-emerald-600 text-lg">📊</span>
                <span className="text-xs font-bold text-emerald-700">Aperçu</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-purple-600 text-base">⚖️</span>
                  <div>
                    <p className="font-bold text-gray-900">{declarations.length} déclaration(s) en attente</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">
                      À traiter dans l&apos;onglet Validations Prix.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-emerald-600 text-base">👥</span>
                  <div>
                    <p className="font-bold text-gray-900">{utilisateursActifs} compte(s) actifs</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">sur {utilisateurs.length} inscrits au total.</p>
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

            {regions.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-900 mb-2">Régions couvertes</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{regions.map((r) => r.nom).join(" · ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: aperçu réel des déclarations en attente, avec actions fonctionnelles */}
        <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900">Déclarations récentes en attente</h2>
            <button onClick={() => setOngletActif("MODERATION")} className="text-xs font-semibold text-[#00B493] hover:underline">
              Voir tout
            </button>
          </div>

          {erreurApercu && (
            <div className="mb-4">
              <MessageErreur message={erreurApercu} />
            </div>
          )}

          {declarations.length === 0 ? (
            <p className="text-xs text-gray-500">Aucune déclaration en attente de validation pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {declarations.slice(0, 3).map((declaration) => (
                <div
                  key={declaration.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                      🌾
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {declaration.produit.nom} — {declaration.region.nom}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Déclaré par {declaration.vendeur?.nom ?? "vendeur inconnu"} le{" "}
                        {new Date(declaration.dateReleve).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">
                        {declaration.prixFcfa.toLocaleString("fr-FR")} FCFA/{declaration.produit.unite}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={idEnCoursApercu === declaration.id}
                        onClick={() => traiterDeclarationApercu(declaration.id, "valider")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition disabled:opacity-50"
                        aria-label="Valider"
                      >
                        ✓
                      </button>
                      <button
                        disabled={idEnCoursApercu === declaration.id}
                        onClick={() => traiterDeclarationApercu(declaration.id, "rejeter")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50"
                        aria-label="Rejeter"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
