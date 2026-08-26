"use client";

import clsx from "clsx";
import type { SnapshotRegion } from "@/lib/api/types";

interface FormeRegion {
  nom: string;
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  /** Position du libellé, ajustée manuellement pour rester lisible dans chaque forme. */
  libelleY?: number;
}

/**
 * Disposition schématique (et non géographiquement exacte) des 5 régions
 * couvertes par SunuPrix, agencées pour rappeler leur position relative sur
 * le territoire (Nord → Sud, Ouest → Est) sans dépendre d'un fond de carte
 * externe. Les noms viennent de `@sunuprix/shared` / de l'API ; seules les
 * coordonnées d'affichage sont fixées ici.
 */
const FORMES: FormeRegion[] = [
  { nom: "Saint-Louis", x: 130, y: 30, largeur: 140, hauteur: 80 },
  { nom: "Louga", x: 150, y: 120, largeur: 120, hauteur: 80 },
  { nom: "Dakar", x: 10, y: 190, largeur: 90, hauteur: 60 },
  { nom: "Thiès", x: 110, y: 210, largeur: 130, hauteur: 90 },
  { nom: "Kaolack", x: 150, y: 310, largeur: 150, hauteur: 90 },
];

interface ProprietesCarteRegions {
  snapshots: SnapshotRegion[];
  regionSelectionneeId: string | null;
  onSelectionner: (regionId: string) => void;
}

function couleurVariation(variation: number | null): { remplissage: string; texte: string } {
  if (variation === null) return { remplissage: "#E5E1D6", texte: "#0B2E24" };
  if (variation > 0) return { remplissage: "#EF9F27", texte: "#0B2E24" };
  if (variation < 0) return { remplissage: "#DC2626", texte: "#FFFFFF" };
  return { remplissage: "#0F6E56", texte: "#FFFFFF" };
}

export function CarteRegions({ snapshots, regionSelectionneeId, onSelectionner }: ProprietesCarteRegions) {
  return (
    <svg viewBox="0 0 300 420" role="img" aria-label="Carte des 5 régions suivies par SunuPrix" className="mx-auto w-full max-w-xs">
      {FORMES.map((forme) => {
        const snapshot = snapshots.find((s) => s.region === forme.nom);
        const selectionnee = snapshot?.regionId === regionSelectionneeId;
        const { remplissage, texte } = couleurVariation(snapshot?.variationMensuellePourcent ?? null);

        return (
          <g
            key={forme.nom}
            onClick={() => snapshot && onSelectionner(snapshot.regionId)}
            onKeyDown={(evenement) => {
              if ((evenement.key === "Enter" || evenement.key === " ") && snapshot) {
                evenement.preventDefault();
                onSelectionner(snapshot.regionId);
              }
            }}
            role={snapshot ? "button" : undefined}
            tabIndex={snapshot ? 0 : undefined}
            aria-pressed={selectionnee}
            aria-label={snapshot ? `${forme.nom} — voir le détail` : undefined}
            className={clsx(
              "transition-opacity focus:outline-none focus-visible:opacity-90",
              snapshot ? "cursor-pointer hover:opacity-90" : "cursor-default opacity-50",
            )}
          >
            <rect
              x={forme.x}
              y={forme.y}
              width={forme.largeur}
              height={forme.hauteur}
              rx={14}
              fill={remplissage}
              stroke={selectionnee ? "#0B2E24" : "rgba(11,46,36,0.15)"}
              strokeWidth={selectionnee ? 3 : 1}
            />
            <text
              x={forme.x + forme.largeur / 2}
              y={forme.y + forme.hauteur / 2 - 6}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={texte}
            >
              {forme.nom}
            </text>
            <text
              x={forme.x + forme.largeur / 2}
              y={forme.y + forme.hauteur / 2 + 12}
              textAnchor="middle"
              fontSize={11}
              fill={texte}
            >
              {snapshot?.prixActuelFcfa != null ? `${snapshot.prixActuelFcfa.toLocaleString("fr-FR")} FCFA` : "—"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
