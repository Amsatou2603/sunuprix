"use client";

import type { ReactNode } from "react";
import { Mail, Phone, Calendar, ShieldCheck, ShieldOff, LogOut, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { useAuth } from "@/lib/auth/AuthContext";
import { LIBELLES_ROLES } from "@sunuprix/shared";
import type { Role } from "@sunuprix/shared";

/** Même mapping que la navbar (`Header.tsx`) — espace dédié propre à chaque rôle. */
const LIEN_ESPACE_PAR_ROLE: Partial<Record<Role, { href: string; label: string }>> = {
  VENDEUR: { href: "/vendeur", label: "Espace Vendeur" },
  CHERCHEUR: { href: "/chercheur", label: "Dashboard Chercheur" },
  MINISTERE: { href: "/ministere", label: "Espace Ministère" },
  ADMIN: { href: "/admin", label: "Centre de Contrôle" },
};

interface ProprietesLigneInfo {
  icone: ReactNode;
  label: string;
  valeur: string;
}

function LigneInfo({ icone, label, valeur }: ProprietesLigneInfo) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-header/50">{label}</p>
        <p className="truncate text-sm font-semibold text-header">{valeur}</p>
      </div>
    </div>
  );
}

function ContenuPageProfil() {
  const { utilisateur, deconnecter } = useAuth();
  const router = useRouter();

  if (!utilisateur) return null;

  const gererDeconnexion = async () => {
    await deconnecter();
    router.push("/");
  };

  const lienEspace = LIEN_ESPACE_PAR_ROLE[utilisateur.role];
  const dateInscription = new Date(utilisateur.creeLe).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Mon profil</h1>
        <p className="mt-1 text-sm text-header/60">Vos informations de compte SunuPrix.</p>
      </div>

      {/* En-tête identité : avatar, nom, rôle */}
      <div className="carte flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-sm">
          {utilisateur.nom.substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-header">{utilisateur.nom}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {LIBELLES_ROLES[utilisateur.role]}
          </span>
        </div>
      </div>

      {/* Coordonnées et informations du compte */}
      <div className="carte divide-y divide-header/5">
        {utilisateur.email && <LigneInfo icone={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />} label="Adresse e-mail" valeur={utilisateur.email} />}
        {utilisateur.telephone && (
          <LigneInfo icone={<Phone className="h-[18px] w-[18px]" strokeWidth={1.75} />} label="Numéro de téléphone" valeur={utilisateur.telephone} />
        )}
        <LigneInfo icone={<Calendar className="h-[18px] w-[18px]" strokeWidth={1.75} />} label="Membre depuis" valeur={dateInscription} />
        <LigneInfo
          icone={
            utilisateur.actif ? (
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <ShieldOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )
          }
          label="Statut du compte"
          valeur={utilisateur.actif ? "Actif" : "Désactivé"}
        />
      </div>

      {/* Raccourci vers l'espace dédié au rôle, s'il existe */}
      {lienEspace && (
        <Link
          href={lienEspace.href}
          className="carte flex items-center justify-between transition hover:bg-primary/5"
        >
          <span className="text-sm font-semibold text-header">Accéder à mon {lienEspace.label.toLowerCase()}</span>
          <ArrowRight className="h-4 w-4 text-primary" strokeWidth={2} />
        </Link>
      )}

      <button
        onClick={gererDeconnexion}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-header/10 px-5 py-2.5 text-sm font-semibold text-header/70 transition hover:bg-header/5 hover:text-header"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Se déconnecter
      </button>
    </div>
  );
}

export default function PageProfil() {
  return (
    <RouteProtegee>
      <ContenuPageProfil />
    </RouteProtegee>
  );
}
