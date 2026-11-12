"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Lock, UserRound } from "lucide-react";
import { LIBELLES_ROLES, type Role } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { Chargement } from "@/components/partages/EtatAsync";
import { lienAvecSuivant } from "@/lib/navigation/suivant";

interface ProprietesRouteProtegee {
  children: ReactNode;
  /** Si fourni, seuls ces rôles peuvent accéder à la page ; sinon, tout utilisateur connecté. */
  rolesAutorises?: Role[];
  /** Phrase expliquant au visiteur non connecté pourquoi un compte est nécessaire ici. */
  messageVisiteur?: string;
}

/**
 * Message affiché à un visiteur non connecté sur une page qui exige un compte.
 * Les prix et les prédictions restent consultables sans compte (/donnees) :
 * on le rappelle, et la connexion ramène ensuite exactement sur cette page.
 */
function ConnexionRequise({ message }: { message?: string }) {
  const [cheminCourant, setCheminCourant] = useState<string>("/");
  useEffect(() => {
    setCheminCourant(window.location.pathname + window.location.search);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-10">
      <div className="carte w-full text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-header">Connexion requise</h1>
        <p className="mt-2 text-sm leading-relaxed text-header/70">
          {message ?? "Cette fonctionnalité nécessite un compte SunuPrix."}
        </p>
        <p className="mt-1 text-xs text-header/50">
          Les prix et les prédictions restent consultables sans compte.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={lienAvecSuivant("/connexion", cheminCourant)} className="bouton-primaire px-5 py-3 text-sm">
            Se connecter
          </Link>
          <Link href={lienAvecSuivant("/inscription", cheminCourant)} className="bouton-secondaire px-5 py-3 text-sm">
            Créer un compte
          </Link>
        </div>
        <Link href="/donnees" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
          Consulter les prix sans compte
        </Link>
      </div>
    </div>
  );
}

/**
 * Message affiché à un utilisateur connecté dont le rôle n'a pas accès à la
 * page demandée — remplace l'ancienne redirection silencieuse vers l'accueil,
 * qui laissait l'utilisateur sans aucune explication (ex. un Consommateur
 * ouvrant l'Analyse comparative, réservée au profil Analyste).
 */
function AccesReserve({ rolesAutorises, roleActuel }: { rolesAutorises: Role[]; roleActuel: Role }) {
  // L'administrateur a accès à tout : on ne le cite que s'il est le seul rôle autorisé.
  const rolesCites = rolesAutorises.length > 1 ? rolesAutorises.filter((r) => r !== "ADMIN") : rolesAutorises;
  const libelles = rolesCites.map((r) => LIBELLES_ROLES[r]);
  const listeLisible =
    libelles.length <= 1 ? libelles[0] : `${libelles.slice(0, -1).join(", ")} ou ${libelles[libelles.length - 1]}`;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-10">
      <div className="carte w-full text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-header">Accès réservé</h1>
        <p className="mt-2 text-sm leading-relaxed text-header/70">
          Cette fonctionnalité n&apos;est disponible que pour le profil{" "}
          <strong className="text-header">{listeLisible}</strong>.
        </p>
        <p className="mt-1 text-xs text-header/50">
          Vous êtes connecté(e) avec le profil {LIBELLES_ROLES[roleActuel]}.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/donnees" className="bouton-primaire px-5 py-3 text-sm">
            Voir les données
          </Link>
          <Link href="/" className="bouton-secondaire px-5 py-3 text-sm">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Garde de route côté client, réutilisable sur toute page nécessitant une
 * authentification (et éventuellement un rôle précis). Un visiteur non
 * connecté voit une invitation à se connecter (au lieu d'une redirection
 * silencieuse), qui le ramène ensuite sur la page demandée.
 */
export function RouteProtegee({ children, rolesAutorises, messageVisiteur }: ProprietesRouteProtegee) {
  const { utilisateur, chargementInitial } = useAuth();

  if (chargementInitial) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Chargement libelle="Chargement de votre session…" />
      </div>
    );
  }

  if (!utilisateur) return <ConnexionRequise message={messageVisiteur} />;

  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <AccesReserve rolesAutorises={rolesAutorises} roleActuel={utilisateur.role} />;
  }

  return <>{children}</>;
}
