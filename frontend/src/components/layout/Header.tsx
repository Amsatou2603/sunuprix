"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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


const LIEN_ESPACE_PAR_ROLE: Partial<Record<Role, { href: string; label: string }>> = {
  VENDEUR: { href: "/vendeur", label: "Espace Vendeur" },
  CHERCHEUR: { href: "/chercheur", label: "Dashboard Chercheur" },
  MINISTERE: { href: "/ministere", label: "Espace Ministère" },
  ADMIN: { href: "/admin", label: "Centre de Contrôle" },
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
    <Link
      href="/alertes"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
      aria-label="Notifications"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {compte > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
          {compte > 9 ? "9+" : compte}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { utilisateur, chargementInitial, deconnecter } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const gererDeconnexion = async () => {
    await deconnecter();
    router.push("/");
  };

  const lienEspace = utilisateur ? LIEN_ESPACE_PAR_ROLE[utilisateur.role] : undefined;
  const liensNavigation = lienEspace ? [...LIENS_NAVIGATION, lienEspace] : LIENS_NAVIGATION;

  // Render minimal bar for admin dedicated layout to match Image 3, or clean white bar for others
  const isAdminView = pathname.startsWith("/admin");

  if (isAdminView) {
    return null; // Admin page has its own full sidebar navigation as in Image 3
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo Lockup */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
            <Image src="/design/icon.svg" alt="SunuPrix Logo" width={40} height={40} priority className="object-contain" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[#0B4736]">
            Sunu<span className="text-[#04281E]">Prix</span>
          </span>
        </Link>

        {/* Center Nav Items */}
        <nav className="hidden items-center gap-8 md:flex">
          {liensNavigation.map((lien) => {
            const estActif = pathname === lien.href;
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  estActif ? "text-[#00B493] font-semibold" : "text-gray-600 hover:text-[#0B4736]"
                }`}
              >
                {lien.label}
                {estActif && (
                  <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#00B493]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Section */}
        <div className="flex items-center gap-3">
          {chargementInitial ? null : utilisateur ? (
            <>
              <ClocheNotifications />

              {lienEspace && (
                <Link
                  href={lienEspace.href}
                  className="hidden items-center rounded-lg bg-[#00B493] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#009b7e] shadow-sm sm:inline-flex"
                >
                  {lienEspace.label}
                </Link>
              )}


              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B4736] text-xs font-bold text-white shadow-sm">
                  {utilisateur.nom.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-gray-900 leading-none">{utilisateur.nom}</p>
                  <p className="text-[10px] text-[#00B493] font-medium leading-tight mt-0.5">
                    {LIBELLES_ROLES[utilisateur.role]}
                  </p>
                </div>
                <button
                  onClick={gererDeconnexion}
                  className="ml-2 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  title="Déconnexion"
                >
                  🚪
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="text-sm font-medium text-gray-700 hover:text-[#0B4736] px-3 py-1.5"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-[#00B493] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#009b7e]"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Nav strip */}
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
        {liensNavigation.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className={`whitespace-nowrap text-xs font-medium ${
              pathname === lien.href ? "text-[#00B493] font-bold" : "text-gray-600"
            }`}
          >
            {lien.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

