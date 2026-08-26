"use client";

import { useState } from "react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { BoutonExportCsv } from "@/components/chercheur/BoutonExportCsv";
import { VueComparative } from "@/components/chercheur/VueComparative";
import { CarteStat } from "@/components/partages/CarteStat";

function ContenuPageChercheur() {
  const [resume, setResume] = useState<{ pointsDeDonnees: number; entitesComparees: number } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Espace chercheur</h1>
        <p className="mt-1 text-sm text-header/60">
          Exportez les données brutes ou explorez des comparaisons entre régions et produits.
        </p>
      </div>

      {resume && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <CarteStat icone="📊" label="Entités comparées" valeur={resume.entitesComparees} />
          <CarteStat icone="🗂️" label="Points de données analysés" valeur={resume.pointsDeDonnees} couleurIcone="bg-accent/15" />
        </div>
      )}

      <BoutonExportCsv />
      <VueComparative onResultat={setResume} />
    </div>
  );
}

export default function PageChercheur() {
  return (
    <RouteProtegee rolesAutorises={["CHERCHEUR"]}>
      <ContenuPageChercheur />
    </RouteProtegee>
  );
}
