"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EtatVide } from "@/components/partages/EtatAsync";
import type { PointHistoriquePrix, PredictionPublique } from "@/lib/api/types";

interface PointGraphique {
  date: string;
  prixFcfa?: number;
  prixPredit?: number;
}

interface ProprietesGraphiquePrix {
  historique: PointHistoriquePrix[];
  prediction: PredictionPublique | null;
  unite: string;
}

function formaterDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

/** Graphique d'évolution des prix (Recharts) avec prolongement en pointillés vers la prédiction du mois suivant. */
export function GraphiquePrix({ historique, prediction, unite }: ProprietesGraphiquePrix) {
  const points: PointGraphique[] = historique.map((point) => ({
    date: formaterDate(point.date),
    prixFcfa: point.prixFcfa,
  }));

  if (prediction && points.length > 0) {
    // Le dernier point historique est dupliqué sur la série "prédiction" pour
    // que la ligne pointillée reparte visuellement de la courbe réelle.
    points[points.length - 1] = { ...points[points.length - 1], prixPredit: points[points.length - 1].prixFcfa };
    points.push({ date: formaterDate(prediction.dateCible), prixPredit: prediction.prixPredit });
  }

  if (points.length === 0) {
    return (
      <EtatVide
        icone={<TrendingUp className="h-7 w-7" strokeWidth={1.75} />}
        titre="Aucun historique disponible"
        description="Aucun relevé validé pour ce couple produit / région pour le moment."
      />
    );
  }

  return (
    <div className="h-72 w-full overflow-x-auto">
      <div className="h-full min-w-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,46,36,0.08)" />
          <XAxis dataKey="date" fontSize={12} stroke="#0B2E24" tickLine={false} />
          <YAxis
            fontSize={12}
            stroke="#0B2E24"
            tickLine={false}
            width={64}
            tickFormatter={(valeur: number) => valeur.toLocaleString("fr-FR")}
          />
          <Tooltip
            formatter={(valeur: number, nom: string) => [
              `${valeur.toLocaleString("fr-FR")} FCFA/${unite}`,
              nom === "prixFcfa" ? "Prix relevé" : "Prédiction",
            ]}
          />
          <Legend
            formatter={(valeur) => (valeur === "prixFcfa" ? "Prix relevé" : "Prédiction (mois suivant)")}
          />
          <Line type="monotone" dataKey="prixFcfa" name="prixFcfa" stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line
            type="monotone"
            dataKey="prixPredit"
            name="prixPredit"
            stroke="#EF9F27"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
