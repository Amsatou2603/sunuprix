"use client";

import { useState } from "react";
import { ROLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { adminApi } from "@/lib/api/admin";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { UtilisateurPublic } from "@/lib/api/types";

interface ProprietesTableauUtilisateurs {
  utilisateurs: UtilisateurPublic[];
  chargement: boolean;
  onUtilisateurMisAJour: (utilisateur: UtilisateurPublic) => void;
}

/** Tableau de gestion des utilisateurs : changement de rôle et activation/désactivation de compte. */
export function TableauUtilisateurs({ utilisateurs, chargement, onUtilisateurMisAJour }: ProprietesTableauUtilisateurs) {
  const { utilisateur: utilisateurCourant } = useAuth();
  const [erreur, setErreur] = useState<string | null>(null);
  const [idEnCours, setIdEnCours] = useState<string | null>(null);

  const changerRole = async (id: string, role: string) => {
    setIdEnCours(id);
    setErreur(null);
    try {
      onUtilisateurMisAJour(await adminApi.changerRole(id, role));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de changer le rôle.");
    } finally {
      setIdEnCours(null);
    }
  };

  const changerStatut = async (id: string, actif: boolean) => {
    setIdEnCours(id);
    setErreur(null);
    try {
      onUtilisateurMisAJour(await adminApi.changerStatut(id, actif));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de changer le statut.");
    } finally {
      setIdEnCours(null);
    }
  };

  return (
    <div className="carte">
      <h2 className="mb-4 text-sm font-semibold text-header/70">Gestion des utilisateurs</h2>
      {erreur && (
        <div className="mb-3">
          <MessageErreur message={erreur} />
        </div>
      )}

      {chargement ? (
        <Chargement libelle="Chargement des utilisateurs…" />
      ) : utilisateurs.length === 0 ? (
        <EtatVide icone="👤" titre="Aucun utilisateur trouvé" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-header/50">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Rôle</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((utilisateur) => {
                const estSoiMeme = utilisateur.id === utilisateurCourant?.id;
                return (
                  <tr key={utilisateur.id} className="border-b border-black/5">
                    <td className="py-2 pr-4 font-medium text-header">
                      {utilisateur.nom}
                      {estSoiMeme && <span className="ml-1.5 text-xs text-header/40">(vous)</span>}
                    </td>
                    <td className="py-2 pr-4">{utilisateur.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="champ-formulaire !py-1.5 !text-xs"
                        value={utilisateur.role}
                        disabled={idEnCours === utilisateur.id || (estSoiMeme && utilisateur.role === "ADMIN")}
                        onChange={(e) => changerRole(utilisateur.id, e.target.value)}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {LIBELLES_ROLES[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={utilisateur.actif ? "badge-hausse" : "badge-baisse"}>
                        {utilisateur.actif ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        disabled={idEnCours === utilisateur.id || (estSoiMeme && utilisateur.actif)}
                        onClick={() => changerStatut(utilisateur.id, !utilisateur.actif)}
                        className="bouton-secondaire !px-3 !py-1.5 !text-xs"
                      >
                        {utilisateur.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
