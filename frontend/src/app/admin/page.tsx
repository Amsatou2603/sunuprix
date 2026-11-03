"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Scale,
  Settings,
  FileDown,
  ClipboardList,
  Tag,
  MapPin,
  BarChart3,
  MessageCircle,
  Wheat,
  Check,
  X,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
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
  const { deconnecter } = useAuth();
  const router = useRouter();

  const gererDeconnexion = async () => {
    await deconnecter();
    router.push("/");
  };

  // Onglets du Centre de Contrôle, réutilisés par la barre de navigation mobile
  // (la barre latérale n'est affichée qu'à partir de md).
  const ONGLETS_MOBILE = [
    { cle: "VUE_DENSEMBLE" as const, libelle: "Vue d'ensemble" },
    { cle: "UTILISATEURS" as const, libelle: "Utilisateurs" },
    { cle: "MODERATION" as const, libelle: "Validations" },
    { cle: "CONFIG" as const, libelle: "Configuration" },
  ];

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
      // Le bouton reste silencieux en cas d'échec ponctuel ; l'export complet reste disponible côté Analyste.
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
    libelleCourt: { ADMIN: "Admin", ANALYSTE: "Analyste", CONTRIBUTEUR: "Contrib.", CONSOMMATEUR: "Conso." }[role],
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
                <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
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
                <Users className="h-4 w-4" strokeWidth={1.75} />
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
                <Scale className="h-4 w-4" strokeWidth={1.75} />
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
              <Settings className="h-4 w-4" strokeWidth={1.75} />
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
      <main className="min-w-0 flex-1 space-y-8 overflow-y-auto p-4 sm:p-8">
        {/* Barre de navigation mobile : sans elle, la barre latérale étant masquée
            sous md et l'en-tête global absent de /admin, l'administrateur
            n'avait sur téléphone aucun moyen de changer d'onglet ni de quitter la page. */}
        <div className="-mx-4 -mt-4 space-y-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4 sm:-mx-8 sm:-mt-8 sm:px-8 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Image src="/design/icon.svg" alt="SunuPrix Logo" width={28} height={28} />
              <span className="truncate font-serif text-lg font-bold text-[#0B4736]">
                Sunu<span className="text-[#04281E]">Prix</span>
              </span>
              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">Admin</span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <Link href="/donnees" className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                Données
              </Link>
              <button
                type="button"
                onClick={gererDeconnexion}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50"
                title="Déconnexion"
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-8 sm:px-8" aria-label="Onglets du Centre de Contrôle">
            {ONGLETS_MOBILE.map((onglet) => (
              <button
                key={onglet.cle}
                type="button"
                onClick={() => {
                  setOngletActif(onglet.cle);
                  // Sur mobile, le contenu de l'onglet s'affiche sous la vue d'ensemble :
                  // on y amène directement l'utilisateur plutôt que de le laisser chercher.
                  if (onglet.cle !== "VUE_DENSEMBLE") {
                    setTimeout(() => document.getElementById("contenu-onglet-admin")?.scrollIntoView({ behavior: "smooth" }), 60);
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  ongletActif === onglet.cle ? "bg-[#0B4736] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {onglet.libelle}
                {onglet.cle === "MODERATION" && declarations.length > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{declarations.length}</span>
                )}
              </button>
            ))}
            <Link
              href="/chatbot"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600"
            >
              <Image src="/design/sunubot-icon.svg" alt="" width={16} height={16} /> SunuBot
            </Link>
          </nav>
        </div>

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
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.75} /> {enCoursExport ? "Export…" : "Rapport (CSV)"}
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards — données réelles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Utilisateurs Actifs</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {utilisateursActifs} <span className="text-xs font-normal text-gray-400">/ {utilisateurs.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Déclarations en attente</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{declarations.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Tag className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Produits suivis</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{produits.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500">Régions couvertes</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{regions.length}</p>
          </div>
        </div>

        {/* Middle Section: répartition réelle des rôles & aperçu de modération */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Répartition des utilisateurs par rôle (calculée à partir des vrais comptes) */}
          <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-4 shadow-sm sm:p-6 lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Répartition des utilisateurs par rôle</h2>
            </div>

            <div className="flex h-52 items-stretch justify-between gap-2 pt-4 sm:gap-3 sm:px-4">
              {repartitionRoles.map(({ role, libelle, libelleCourt, total }) => (
                <div key={role} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  {/* Conteneur à hauteur définie : sans lui, la hauteur en % de la barre ne se résout pas. */}
                  <div className="relative w-full flex-1">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-[#0B5D48]"
                      style={{ height: `${Math.max(4, (total / maxParRole) * 100)}%` }}
                      title={`${libelle} : ${total}`}
                    />
                  </div>
                  <span className="text-center text-[10px] font-medium text-gray-500" title={libelle}>
                    <span className="sm:hidden">{libelleCourt}</span>
                    <span className="hidden sm:inline">{libelle}</span>
                  </span>
                  <span className="text-xs font-bold text-gray-900">{total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu réel : déclarations en attente + régions couvertes */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                <span className="text-xs font-bold text-emerald-700">Aperçu</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <Scale className="h-4 w-4 shrink-0 text-purple-600" strokeWidth={1.75} />
                  <div>
                    <p className="font-bold text-gray-900">{declarations.length} déclaration(s) en attente</p>
                    <p className="text-gray-500 mt-1 leading-relaxed">
                      À traiter dans l&apos;onglet Validations Prix.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <Users className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.75} />
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
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} /> Interroger SunuBot
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
        <div className="rounded-2xl border border-gray-100 bg-[#F5F5F7] p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900">Déclarations récentes en attente</h2>
            <button onClick={() => setOngletActif("MODERATION")} className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#00B493] hover:underline">
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Wheat className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {declaration.produit.nom} — {declaration.region.nom}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Déclaré par {declaration.contributeur?.nom ?? "contributeur inconnu"} le{" "}
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
                        <Check className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        disabled={idEnCoursApercu === declaration.id}
                        onClick={() => traiterDeclarationApercu(declaration.id, "rejeter")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50"
                        aria-label="Rejeter"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab specific views for User Management, File Moderation, and Config */}
        <div id="contenu-onglet-admin" className="scroll-mt-4" />
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
