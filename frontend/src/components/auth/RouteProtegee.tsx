"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { Chargement } from "@/components/partages/EtatAsync";

interface ProprietesRouteProtegee {
  children: ReactNode;
  /** Si fourni, seuls ces rôles peuvent accéder à la page ; sinon, tout utilisateur connecté. */
  rolesAutorises?: Role[];
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

    if (!utilisateur) {
      router.replace("/connexion");
      return;
    }

    if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
      router.replace("/");
    }
  }, [chargementInitial, utilisateur, rolesAutorises, router]);

  if (chargementInitial) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Chargement libelle="Chargement de votre session…" />
      </div>
    );
  }

  if (!utilisateur || (rolesAutorises && !rolesAutorises.includes(utilisateur.role))) {
    return null;
  }

  return <>{children}</>;
}
