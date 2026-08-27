"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { ministereApi } from "@/lib/api/ministere";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { InflationRegion } from "@/lib/api/types";

interface ProprietesVueInflation {
  /** Rapporte à la page parente le résultat chargé, pour les cartes de statistiques nationales. */
  onCharge?: (inflation: InflationRegion[]) => void;
}

/** Vue agrégée d'inflation par région — moyenne des variations mensuelles des 12 produits suivis. */
export function VueInflation({ onCharge }: ProprietesVueInflation) {
  const [inflation, setInflation] = useState<InflationRegion[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    ministereApi
      .inflation()
      .then((donnees) => {
        setInflation(donnees);
        onCharge?.(donnees);
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger la vue d'inflation."))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="carte">
      <h2 className="text-sm font-semibold text-header/70">Inflation moyenne par région</h2>
      <p className="mt-1 text-sm text-header/50">
        Moyenne, pour chaque région, de la variation mensuelle des 12 produits suivis (dernier relevé validé vs
        précédent).
      </p>

      {chargement && <Chargement libelle="Chargement de la vue d'inflation…" />}
      {!chargement && erreur && <MessageErreur message={erreur} />}
      {!chargement && !erreur && inflation.length === 0 && (
        <EtatVide icone={<TrendingDown className="h-7 w-7" strokeWidth={1.75} />} titre="Aucune donnée d'inflation disponible" />
      )}

      {!chargement && !erreur && inflation.length > 0 && (
      <div className="mt-4 h-72 w-full overflow-x-auto">
        <div className="h-full min-w-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={inflation} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,46,36,0.08)" />
            <XAxis dataKey="region" fontSize={12} stroke="#0B2E24" />
            <YAxis fontSize={12} stroke="#0B2E24" width={48} unit="%" />
            <Tooltip
              formatter={(valeur: number, _nom: string, contexte: { payload?: InflationRegion }) => [
                `${valeur}% (${contexte.payload?.nombreProduitsPrisEnCompte ?? 0} produits)`,
                "Inflation moyenne",
              ]}
            />
            <Bar dataKey="inflationMoyennePourcent" radius={[6, 6, 0, 0]}>
              {inflation.map((entree) => (
                <Cell key={entree.regionId} fill={(entree.inflationMoyennePourcent ?? 0) >= 0 ? "#EF9F27" : "#DC2626"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      )}
    </div>
  );
}
