"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { LIBELLES_ROLES, type Role } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { Chargement } from "@/components/partages/EtatAsync";

interface ProprietesRouteProtegee {
  children: ReactNode;
  /** Si fourni, seuls ces rôles peuvent accéder à la page ; sinon, tout utilisateur connecté. */
  rolesAutorises?: Role[];
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
 * authentification (et éventuellement un rôle précis). Centralise la logique
 * de redirection plutôt que de la répéter dans chaque page protégée.
 */
export function RouteProtegee({ children, rolesAutorises }: ProprietesRouteProtegee) {
  const { utilisateur, chargementInitial } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (chargementInitial) return;
    if (!utilisateur) router.replace("/connexion");
  }, [chargementInitial, utilisateur, router]);

  if (chargementInitial) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Chargement libelle="Chargement de votre session…" />
      </div>
    );
  }

  if (!utilisateur) return null;

  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <AccesReserve rolesAutorises={rolesAutorises} roleActuel={utilisateur.role} />;
  }

  return <>{children}</>;
}
