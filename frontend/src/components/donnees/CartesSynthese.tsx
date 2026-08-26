import clsx from "clsx";
import { BadgeVariation } from "@/components/partages/BadgeVariation";
import { EtatVide } from "@/components/partages/EtatAsync";
import type { SnapshotRegion } from "@/lib/api/types";

interface ProprietesCartesSynthese {
  snapshots: SnapshotRegion[];
  regionSelectionneeId: string | null;
  onSelectionner: (regionId: string) => void;
}

/** Cartes de synthèse par région pour le produit sélectionné : dernier prix connu et variation mensuelle. */
export function CartesSynthese({ snapshots, regionSelectionneeId, onSelectionner }: ProprietesCartesSynthese) {
  if (snapshots.length === 0) {
    return <EtatVide icone="🗺️" titre="Aucune donnée régionale" description="Aucun relevé validé pour ce produit pour le moment." />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {snapshots.map((snapshot) => {
        const selectionnee = snapshot.regionId === regionSelectionneeId;
        return (
          <button
            key={snapshot.regionId}
            type="button"
            onClick={() => onSelectionner(snapshot.regionId)}
            className={clsx(
              "carte text-left transition-shadow hover:shadow-md",
              selectionnee && "ring-2 ring-primary",
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-header/50">{snapshot.region}</p>
            <p className="mt-1 text-lg font-bold text-header">
              {snapshot.prixActuelFcfa != null ? `${snapshot.prixActuelFcfa.toLocaleString("fr-FR")} FCFA` : "Aucune donnée"}
            </p>
            <div className="mt-2">
              <BadgeVariation valeur={snapshot.variationMensuellePourcent} suffixe="ce mois" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
