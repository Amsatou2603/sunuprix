"use client";

import { useState } from "react";
import { telechargerExportCsv } from "@/lib/api/export";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";

/** Déclenche le téléchargement de l'export CSV complet (relevés de prix + prédictions). */
export function BoutonExportCsv() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const exporter = async () => {
    setEnCours(true);
    setErreur(null);
    setSucces(false);
    try {
      await telechargerExportCsv();
      setSucces(true);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de générer l'export.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="carte flex flex-col gap-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-header/70">Export des données</h2>
          <p className="mt-1 text-sm text-header/50">
            Téléchargez l&apos;ensemble des relevés de prix validés et des prédictions au format CSV.
          </p>
        </div>
        <button type="button" onClick={exporter} disabled={enCours} className="bouton-primaire w-full whitespace-nowrap sm:w-auto">
          {enCours ? "Génération…" : "Exporter en CSV"}
        </button>
      </div>
      {erreur && <MessageErreur message={erreur} />}
      {succes && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">Export téléchargé.</p>}
    </div>
  );
}
