"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { DeclarationPrixPublique } from "@/lib/api/types";

interface ProprietesFileModeration {
  declarations: DeclarationPrixPublique[];
  chargement: boolean;
  onDeclarationTraitee: (id: string) => void;
}

/** File de modération des déclarations de prix vendeur en attente de validation. */
export function FileModeration({ declarations, chargement, onDeclarationTraitee }: ProprietesFileModeration) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [idEnCours, setIdEnCours] = useState<string | null>(null);

  const traiter = async (id: string, action: "valider" | "rejeter") => {
    setIdEnCours(id);
    setErreur(null);
    try {
      await (action === "valider" ? adminApi.validerDeclaration(id) : adminApi.rejeterDeclaration(id));
      onDeclarationTraitee(id);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de traiter cette déclaration.");
    } finally {
      setIdEnCours(null);
    }
  };

  return (
    <div className="carte">
      <h2 className="mb-4 text-sm font-semibold text-header/70">Déclarations vendeur en attente</h2>
      {erreur && (
        <div className="mb-3">
          <MessageErreur message={erreur} />
        </div>
      )}

      {chargement ? (
        <Chargement libelle="Chargement de la file de modération…" />
      ) : declarations.length === 0 ? (
        <EtatVide icone="✅" titre="File de modération vide" description="Aucune déclaration vendeur en attente de validation." />
      ) : (
        <ul className="space-y-3">
          {declarations.map((declaration) => (
            <li
              key={declaration.id}
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium text-header">
                  {declaration.produit.nom} à {declaration.region.nom} — {declaration.prixFcfa.toLocaleString("fr-FR")} FCFA/
                  {declaration.produit.unite}
                </p>
                <p className="text-header/50">
                  Déclaré par {declaration.vendeur?.nom ?? "vendeur inconnu"} le{" "}
                  {new Date(declaration.dateReleve).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={idEnCours === declaration.id}
                  onClick={() => traiter(declaration.id, "valider")}
                  className="bouton-primaire !px-3 !py-1.5 !text-xs"
                >
                  Valider
                </button>
                <button
                  type="button"
                  disabled={idEnCours === declaration.id}
                  onClick={() => traiter(declaration.id, "rejeter")}
                  className="bouton-secondaire !px-3 !py-1.5 !text-xs"
                >
                  Rejeter
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
