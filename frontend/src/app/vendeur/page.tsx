"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { FormulaireDeclaration } from "@/components/vendeur/FormulaireDeclaration";
import { HistoriqueDeclarations } from "@/components/vendeur/HistoriqueDeclarations";
import { CarteStat } from "@/components/partages/CarteStat";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { prixApi } from "@/lib/api/prix";
import { ErreurApi } from "@/lib/api/api-client";
import type { DeclarationPrixPublique } from "@/lib/api/types";

function ContenuPageVendeur() {
  const [declarations, setDeclarations] = useState<DeclarationPrixPublique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const rafraichir = () => {
    setChargement(true);
    setErreur(null);
    prixApi
      .mesDeclarations()
      .then(setDeclarations)
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger votre historique."))
      .finally(() => setChargement(false));
  };

  useEffect(rafraichir, []);

  // Statistiques dérivées de l'historique réellement chargé — jamais de valeur fixe.
  const statistiques = useMemo(() => {
    const enAttente = declarations.filter((d) => d.statut === "EN_ATTENTE").length;
    const validees = declarations.filter((d) => d.statut === "VALIDE").length;
    const rejetees = declarations.filter((d) => d.statut === "REJETE").length;
    return { total: declarations.length, enAttente, validees, rejetees };
  }, [declarations]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Espace vendeur</h1>
        <p className="mt-1 text-sm text-header/60">
          Déclarez les prix que vous constatez sur le terrain ; chaque déclaration est vérifiée par un administrateur
          avant d&apos;être prise en compte dans les statistiques publiques.
        </p>
      </div>

      {erreur && <MessageErreur message={erreur} />}

      {!chargement && declarations.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CarteStat icone="🧾" label="Déclarations envoyées" valeur={statistiques.total} />
          <CarteStat icone="⏳" label="En attente" valeur={statistiques.enAttente} couleurIcone="bg-accent/15" />
          <CarteStat icone="✅" label="Validées" valeur={statistiques.validees} couleurIcone="bg-primary/10" />
          <CarteStat icone="⛔" label="Rejetées" valeur={statistiques.rejetees} couleurIcone="bg-red-100" />
        </div>
      )}

      <FormulaireDeclaration onDeclaree={(declaration) => setDeclarations((precedentes) => [declaration, ...precedentes])} />

      <div className="carte">
        <h2 className="mb-4 text-sm font-semibold text-header/70">Mes déclarations</h2>
        <HistoriqueDeclarations declarations={declarations} chargement={chargement} />
      </div>
    </div>
  );
}

export default function PageVendeur() {
  return (
    <RouteProtegee rolesAutorises={["VENDEUR"]}>
      <ContenuPageVendeur />
    </RouteProtegee>
  );
}
