"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
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

  const rendreSelecteurRole = (utilisateur: (typeof utilisateurs)[number], estSoiMeme: boolean, classe = "") => (
    <select
      className={`champ-formulaire !py-1.5 !text-xs ${classe}`}
      value={utilisateur.role}
      aria-label={`Rôle de ${utilisateur.nom}`}
      disabled={idEnCours === utilisateur.id || (estSoiMeme && utilisateur.role === "ADMIN")}
      onChange={(e) => changerRole(utilisateur.id, e.target.value)}
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {LIBELLES_ROLES[role]}
        </option>
      ))}
    </select>
  );

  const rendreBoutonStatut = (utilisateur: (typeof utilisateurs)[number], estSoiMeme: boolean) => (
    <button
      type="button"
      disabled={idEnCours === utilisateur.id || (estSoiMeme && utilisateur.actif)}
      onClick={() => changerStatut(utilisateur.id, !utilisateur.actif)}
      className="bouton-secondaire shrink-0 !px-3 !py-1.5 !text-xs"
    >
      {utilisateur.actif ? "Désactiver" : "Réactiver"}
    </button>
  );

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
        <EtatVide icone={<UserX className="h-7 w-7" strokeWidth={1.75} />} titre="Aucun utilisateur trouvé" />
      ) : (
        <>
        {/* Mobile : une carte par utilisateur plutôt qu'un tableau à faire défiler horizontalement. */}
        <ul className="space-y-3 sm:hidden">
          {utilisateurs.map((utilisateur) => {
            const estSoiMeme = utilisateur.id === utilisateurCourant?.id;
            return (
              <li key={utilisateur.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-header">
                      {utilisateur.nom}
                      {estSoiMeme && <span className="ml-1.5 text-xs text-header/40">(vous)</span>}
                    </p>
                    <p className="mt-0.5 break-all text-xs text-header/60">
                      {utilisateur.email ?? utilisateur.telephone ?? "—"}
                    </p>
                  </div>
                  <span className={`shrink-0 ${utilisateur.actif ? "badge-hausse" : "badge-baisse"}`}>
                    {utilisateur.actif ? "Actif" : "Désactivé"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {rendreSelecteurRole(utilisateur, estSoiMeme, "min-w-[9.5rem] flex-1")}
                  {rendreBoutonStatut(utilisateur, estSoiMeme)}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-header/50">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Contact</th>
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
                    <td className="py-2 pr-4">
                      {utilisateur.email ?? utilisateur.telephone ?? (
                        <span className="text-header/30">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {rendreSelecteurRole(utilisateur, estSoiMeme)}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={utilisateur.actif ? "badge-hausse" : "badge-baisse"}>
                        {utilisateur.actif ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {rendreBoutonStatut(utilisateur, estSoiMeme)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
