"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, MapPin, Megaphone } from "lucide-react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { VueInflation } from "@/components/ministere/VueInflation";
import { FormulaireAnnonce } from "@/components/ministere/FormulaireAnnonce";
import { ListeAnnonces } from "@/components/partages/ListeAnnonces";
import { CarteStat } from "@/components/partages/CarteStat";
import { BadgeVariation } from "@/components/partages/BadgeVariation";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { ministereApi } from "@/lib/api/ministere";
import { ErreurApi } from "@/lib/api/api-client";
import type { Annonce, InflationRegion } from "@/lib/api/types";

function ContenuPageMinistere() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [inflation, setInflation] = useState<InflationRegion[] | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    ministereApi
      .annonces()
      .then(setAnnonces)
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger les annonces."))
      .finally(() => setChargement(false));
  }, []);

  // Moyenne nationale dérivée des inflations régionales réellement chargées par VueInflation.
  const inflationNationale = useMemo(() => {
    if (!inflation) return null;
    const valeurs = inflation.map((r) => r.inflationMoyennePourcent).filter((v): v is number => v !== null);
    if (valeurs.length === 0) return null;
    return Math.round((valeurs.reduce((s, v) => s + v, 0) / valeurs.length) * 10) / 10;
  }, [inflation]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Espace Ministère</h1>
        <p className="mt-1 text-sm text-header/60">
          Suivez l&apos;inflation régionale et publiez des annonces officielles visibles par tous les utilisateurs.
        </p>
      </div>

      {erreur && <MessageErreur message={erreur} />}

      {inflation && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CarteStat
            icone={<TrendingUp className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            label="Inflation nationale moyenne"
            valeur={inflationNationale !== null ? <BadgeVariation valeur={inflationNationale} /> : "—"}
          />
          <CarteStat
            icone={<MapPin className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            label="Régions suivies"
            valeur={inflation.length}
            couleurIcone="bg-accent/15 text-accent-dark"
          />
          <CarteStat
            icone={<Megaphone className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            label="Annonces publiées"
            valeur={annonces.length}
          />
        </div>
      )}

      <VueInflation onCharge={setInflation} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FormulaireAnnonce onPublieee={(annonce) => setAnnonces((precedentes) => [annonce, ...precedentes])} />
        <div>
          <h2 className="mb-3 text-sm font-semibold text-header/70">Annonces publiées</h2>
          <ListeAnnonces annonces={annonces} chargement={chargement} />
        </div>
      </div>
    </div>
  );
}

export default function PageMinistere() {
  return (
    <RouteProtegee rolesAutorises={["MINISTERE"]}>
      <ContenuPageMinistere />
    </RouteProtegee>
  );
}
