"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient, ErreurApi } from "../api/api-client";
import type { ReponseAuthentification, UtilisateurPublic } from "../api/types";

/**
 * Contexte d'authentification global.
 *
 * Le JWT lui-même n'est JAMAIS manipulé ni stocké côté client : il vit
 * uniquement dans un cookie httpOnly posé par le backend (voir
 * auth.controller.ts), donc inaccessible au JavaScript de la page — c'est le
 * stockage "sécurisé" demandé. Ce contexte ne garde en mémoire que le profil
 * utilisateur courant (non sensible), obtenu via GET /api/auth/moi.
 */

interface EntreeInscription {
  nom: string;
  email: string;
  motDePasse: string;
  role: string;
}

interface EntreeConnexion {
  email: string;
  motDePasse: string;
}

interface ValeurContexteAuth {
  utilisateur: UtilisateurPublic | null;
  chargementInitial: boolean;
  connecter: (entree: EntreeConnexion) => Promise<void>;
  inscrire: (entree: EntreeInscription) => Promise<void>;
  deconnecter: () => Promise<void>;
}

const ContexteAuth = createContext<ValeurContexteAuth | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<UtilisateurPublic | null>(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  const rafraichirProfil = useCallback(async () => {
    try {
      const reponse = await apiClient.get<ReponseAuthentification>("/api/auth/moi");
      setUtilisateur(reponse.utilisateur);
    } catch (erreur) {
      if (!(erreur instanceof ErreurApi && erreur.statut === 401)) {
        // eslint-disable-next-line no-console
        console.error("[SunuPrix] Impossible de récupérer le profil courant :", erreur);
      }
      setUtilisateur(null);
    }
  }, []);

  useEffect(() => {
    rafraichirProfil().finally(() => setChargementInitial(false));
  }, [rafraichirProfil]);

  const connecter = useCallback(async (entree: EntreeConnexion) => {
    const reponse = await apiClient.post<ReponseAuthentification>("/api/auth/connexion", entree);
    setUtilisateur(reponse.utilisateur);
  }, []);

  const inscrire = useCallback(async (entree: EntreeInscription) => {
    const reponse = await apiClient.post<ReponseAuthentification>("/api/auth/inscription", entree);
    setUtilisateur(reponse.utilisateur);
  }, []);

  const deconnecter = useCallback(async () => {
    await apiClient.post("/api/auth/deconnexion");
    setUtilisateur(null);
  }, []);

  const valeur = useMemo<ValeurContexteAuth>(
    () => ({ utilisateur, chargementInitial, connecter, inscrire, deconnecter }),
    [utilisateur, chargementInitial, connecter, inscrire, deconnecter],
  );

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}

export function useAuth(): ValeurContexteAuth {
  const contexte = useContext(ContexteAuth);
  if (!contexte) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  }
  return contexte;
}
