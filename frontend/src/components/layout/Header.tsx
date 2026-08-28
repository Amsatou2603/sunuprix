"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
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

// Libellés longs ("Dashboard Chercheur", "Centre de Contrôle"...) trop larges
// à côté du logo sur petit écran, une fois pliés avec la cloche + l'avatar —
// on raccourcit juste pour la variante mobile.
const LIBELLE_COURT_PAR_ROLE: Partial<Record<Role, string>> = {
  VENDEUR: "Vendeur",
  CHERCHEUR: "Chercheur",
  MINISTERE: "Ministère",
  ADMIN: "Admin",
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
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-header/10 bg-white/70 text-header/70 shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-white"
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
  const libelleCourtEspace = utilisateur ? LIBELLE_COURT_PAR_ROLE[utilisateur.role] : undefined;
  // L'espace dédié au rôle (Vendeur/Chercheur/Ministère/Admin) a son propre
  // bouton vert (à côté du logo sur mobile, à côté du pseudo sur sm+, cf. plus
  // bas) — inutile de le dupliquer ici dans la nav centrale.
  const liensNavigation = LIENS_NAVIGATION;

  // Render minimal bar for admin dedicated layout to match Image 3, or clean white bar for others
  const isAdminView = pathname.startsWith("/admin");

  if (isAdminView) {
    return null; // Admin page has its own full sidebar navigation as in Image 3
  }

  return (
    <motion.div
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-2 z-40 px-2 sm:top-4 sm:px-4"
    >
      <header className="verre mx-auto flex max-w-6xl items-center justify-between gap-1.5 !rounded-full px-3 py-1.5 sm:gap-3 sm:px-6 sm:py-2.5">
        {/* Brand Logo Lockup + raccourci Espace (variante compacte, mobile uniquement) */}
        <div className="flex min-w-0 shrink items-center gap-1.5">
          <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 group sm:gap-2.5">
            <div className="relative h-7 w-7 shrink-0 transition-transform group-hover:scale-105 sm:h-9 sm:w-9">
              <Image src="/design/icon.svg" alt="SunuPrix Logo" width={36} height={36} priority className="object-contain" />
            </div>
            <span className="truncate font-serif text-base font-bold tracking-tight text-primary sm:text-xl">
              Sunu<span className="text-primary-light">Prix</span>
            </span>
          </Link>

          {lienEspace && (
            <Link
              href={lienEspace.href}
              className="inline-flex shrink-0 items-center rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-primary-dark sm:hidden"
            >
              {libelleCourtEspace ?? lienEspace.label}
            </Link>
          )}
        </div>

        {/* Center Nav Items */}
        <nav className="hidden items-center gap-1 md:flex">
          {liensNavigation.map((lien) => {
            const estActif = pathname === lien.href;
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  estActif ? "bg-primary/10 font-semibold text-primary-dark" : "text-header/60 hover:bg-header/5 hover:text-header"
                }`}
              >
                {lien.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
          {chargementInitial ? null : utilisateur ? (
            <>
              <ClocheNotifications />

              {lienEspace && (
                <Link
                  href={lienEspace.href}
                  className="hidden items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-primary-dark sm:inline-flex"
                >
                  {lienEspace.label}
                </Link>
              )}


              <div className="flex items-center gap-1.5 border-l border-header/10 pl-1.5 sm:gap-2 sm:pl-2.5">
                <Link
                  href="/profil"
                  className="flex items-center gap-1.5 rounded-full py-0.5 pr-1 transition hover:bg-header/5 sm:gap-2"
                  title="Voir mon profil"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm sm:h-8 sm:w-8">
                    {utilisateur.nom.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold leading-none text-header">{utilisateur.nom}</p>
                    <p className="mt-0.5 text-[10px] font-medium leading-tight text-primary">
                      {LIBELLES_ROLES[utilisateur.role]}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={gererDeconnexion}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-header/50 transition hover:bg-header/5 hover:text-header"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="rounded-full px-2 py-1.5 text-xs font-medium text-header/70 hover:text-header sm:px-3.5 sm:text-sm"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.03] hover:bg-primary-dark sm:px-4 sm:py-2 sm:text-sm"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile Nav strip */}
      <nav className="verre mx-auto mt-2 flex max-w-6xl items-center gap-4 overflow-x-auto !rounded-full px-4 py-2 md:hidden">
        {liensNavigation.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className={`whitespace-nowrap text-xs font-medium ${
              pathname === lien.href ? "font-bold text-primary-dark" : "text-header/60"
            }`}
          >
            {lien.label}
          </Link>
        ))}
      </nav>
    </motion.div>
  );
}
