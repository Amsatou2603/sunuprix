"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { LIBELLES_ROLES } from "@sunuprix/shared";
import type { Role } from "@sunuprix/shared";
import { notificationsApi } from "@/lib/api/alertes";

const LIENS_NAVIGATION = [
  { href: "/", label: "Accueil" },
  { href: "/donnees", label: "Données" },
  { href: "/alertes", label: "Alertes" },
  { href: "/a-propos", label: "À propos" },
];

/** Lien d'espace supplémentaire propre à chaque rôle, ajouté à la navigation commune. */
const LIEN_ESPACE_PAR_ROLE: Partial<Record<Role, { href: string; label: string }>> = {
  VENDEUR: { href: "/vendeur", label: "Espace vendeur" },
  CHERCHEUR: { href: "/chercheur", label: "Espace chercheur" },
  MINISTERE: { href: "/ministere", label: "Espace Ministère" },
  ADMIN: { href: "/admin", label: "Administration" },
};

function ClocheNotifications() {
  const [compte, setCompte] = useState(0);

  useEffect(() => {
    let annule = false;
    const rafraichir = () => {
      notificationsApi
        .compterNonLues()
        .then((valeur) => {
          if (!annule) setCompte(valeur);
        })
        .catch(() => undefined);
    };
    rafraichir();
    const intervalle = setInterval(rafraichir, 60_000);
    return () => {
      annule = true;
      clearInterval(intervalle);
    };
  }, []);

  return (
    <Link href="/alertes" className="relative rounded-lg p-2 text-white/80 transition-colors hover:text-white" aria-label="Notifications">
      🔔
      {compte > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-header">
          {compte > 9 ? "9+" : compte}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { utilisateur, chargementInitial, deconnecter } = useAuth();
  const router = useRouter();

  const gererDeconnexion = async () => {
    await deconnecter();
    router.push("/");
  };

  const lienEspace = utilisateur ? LIEN_ESPACE_PAR_ROLE[utilisateur.role] : undefined;
  const liensNavigation = lienEspace ? [...LIENS_NAVIGATION, lienEspace] : LIENS_NAVIGATION;

  return (
    <header className="bg-header text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/design/icon.svg" alt="Logo SunuPrix" width={36} height={36} priority />
          <span className="text-lg font-bold tracking-tight">
            Sunu<span className="text-accent">Prix</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {liensNavigation.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {chargementInitial ? null : utilisateur ? (
            <>
              <ClocheNotifications />
              <span className="hidden text-sm text-white/70 sm:inline">
                {utilisateur.nom} · <span className="text-accent">{LIBELLES_ROLES[utilisateur.role]}</span>
              </span>
              <button
                onClick={gererDeconnexion}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-header transition-colors hover:bg-accent-light"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        {liensNavigation.map((lien) => (
          <Link key={lien.href} href={lien.href} className="whitespace-nowrap text-sm text-white/80 hover:text-white">
            {lien.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
