import { EtatVide } from "@/components/partages/EtatAsync";
import type { PointHistoriquePrix } from "@/lib/api/types";
import { History } from "lucide-react";

interface ProprietesTableauHistorique {
  historique: PointHistoriquePrix[];
  unite: string;
}

function formaterDateComplete(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Détail ligne par ligne de l'historique validé (le plus récent en haut),
 * avec un badge d'origine par relevé — c'est ici, contrairement au
 * graphique agrégé, que la distinction SYSTEME (calibrage simulé) /
 * CONTRIBUTEUR (déclaration réelle) documentée au chapitre Données du
 * mémoire devient visible relevé par relevé, pas seulement en moyenne.
 */
export function TableauHistorique({ historique, unite }: ProprietesTableauHistorique) {
  if (historique.length === 0) {
    return (
      <EtatVide
        icone={<History className="h-7 w-7" strokeWidth={1.75} />}
        titre="Aucun relevé"
        description="Aucun relevé validé pour ce couple produit / région pour le moment."
      />
    );
  }

  const lignes = [...historique].reverse();

  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-header/40">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Prix</th>
            <th className="py-2">Origine</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((point, indice) => (
            <tr key={`${point.date}-${indice}`} className="border-b border-gray-50 last:border-0">
              <td className="py-2 pr-3 text-header/70">{formaterDateComplete(point.date)}</td>
              <td className="py-2 pr-3 font-semibold text-header">
                {point.prixFcfa.toLocaleString("fr-FR")} FCFA/{unite}
              </td>
              <td className="py-2">
                {point.source === "CONTRIBUTEUR" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Contributeur (réel)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                    Calibrage (simulé)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
