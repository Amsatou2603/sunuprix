"use client";

import clsx from "clsx";
import type { SnapshotRegion } from "@/lib/api/types";
import {
  CONTOUR_SENEGAL,
  POSITIONS_REGIONS,
  LARGEUR_VUE_SENEGAL,
  HAUTEUR_VUE_SENEGAL,
} from "@/lib/senegal-map";

interface ProprietesCarteRegions {
  snapshots: SnapshotRegion[];
  regionSelectionneeId: string | null;
  onSelectionner: (regionId: string) => void;
}

function couleurVariation(variation: number | null): string {
  if (variation === null) return "#9CA3AF";
  if (variation > 0) return "#EF9F27";
  if (variation < 0) return "#DC2626";
  return "#0F6E56";
}

/** Pour le libellé de région sur fond clair (blanc ou fond sélectionné sombre). */
function classeTexteVariation(variation: number | null): string {
  if (variation === null) return "text-gray-400";
  if (variation > 0) return "text-accent-dark";
  if (variation < 0) return "text-red-600";
  return "text-primary";
}

/** Pour l'info-bulle au survol, posée sur un fond sombre (bg-header) — teintes claires pour rester lisibles. */
function classeTexteVariationSurFondSombre(variation: number | null): string {
  if (variation === null) return "text-white/50";
  if (variation > 0) return "text-accent-light";
  if (variation < 0) return "text-red-300";
  return "text-primary-light";
}

/**
 * Décalages fins (en pixels, appliqués uniquement au nom de région — pas au
 * repère lui-même, qui reste sur ses vraies coordonnées géographiques) pour
 * les régions dont les points sont trop proches pour que leurs étiquettes
 * tiennent côte à côte sans se chevaucher dans cette carte compacte :
 * Saint-Louis/Louga (proches verticalement) et Dakar/Thiès (proches
 * horizontalement, presque à la même latitude).
 */
const DECALAGES_ETIQUETTE: Record<string, { x: number; y: number }> = {
  "Saint-Louis": { x: 26, y: -10 },
  Louga: { x: -28, y: 4 },
  Dakar: { x: -4, y: 16 },
  Thiès: { x: 28, y: -4 },
};

/**
 * Carte interactive des 5 régions suivies par SunuPrix, sur le vrai contour
 * du Sénégal (même tracé et mêmes coordonnées géographiques que l'aperçu de
 * la page d'accueil, `CarteApercuAccueil`) plutôt que sur un agencement de
 * carrés colorés sans rapport avec la forme réelle du pays.
 *
 * Chaque région reste un vrai bouton cliquable/focusable (comportement
 * conservé de l'ancienne carte) : un clic ou Entrée/Espace la sélectionne.
 * Le nom de chaque région est toujours visible ; le prix et la variation
 * mensuelle apparaissent au survol/focus (info-bulle). Le prix de la région
 * actuellement sélectionnée s'affiche dans un bandeau au-dessus de la carte
 * plutôt que sur le repère lui-même — Dakar et Thiès (ou Saint-Louis et
 * Louga) étant géographiquement trop proches pour caser un prix en plus du
 * nom sans chevauchement dans une carte aussi compacte.
 */
export function CarteRegions({ snapshots, regionSelectionneeId, onSelectionner }: ProprietesCarteRegions) {
  const snapshotSelectionne = snapshots.find((s) => s.regionId === regionSelectionneeId);
  const prixSelectionTexte =
    snapshotSelectionne?.prixActuelFcfa != null
      ? `${snapshotSelectionne.prixActuelFcfa.toLocaleString("fr-FR")} FCFA`
      : null;

  return (
    <div className="mx-auto w-full max-w-sm">
      {snapshotSelectionne && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs">
          <span className="font-bold text-header">{snapshotSelectionne.region}</span>
          <span className="flex items-center gap-1.5 font-bold text-header/80">
            {prixSelectionTexte ?? "—"}
            {snapshotSelectionne.variationMensuellePourcent != null && (
              <span className={classeTexteVariation(snapshotSelectionne.variationMensuellePourcent)}>
                ({snapshotSelectionne.variationMensuellePourcent > 0 ? "+" : ""}
                {snapshotSelectionne.variationMensuellePourcent.toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      )}

      <div className="relative aspect-[440/380] w-full">
        <svg
          viewBox={`0 0 ${LARGEUR_VUE_SENEGAL} ${HAUTEUR_VUE_SENEGAL}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <polygon
            points={CONTOUR_SENEGAL}
            fill="rgba(15,110,86,0.05)"
            stroke="rgba(11,46,36,0.18)"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </svg>

        <div role="group" aria-label="Carte des 5 régions suivies par SunuPrix" className="absolute inset-0">
          {POSITIONS_REGIONS.map((position) => {
          const snapshot = snapshots.find((s) => s.region === position.nom);
          const selectionnee = !!snapshot && snapshot.regionId === regionSelectionneeId;
          const couleur = couleurVariation(snapshot?.variationMensuellePourcent ?? null);
          const prixTexte = snapshot?.prixActuelFcfa != null ? `${snapshot.prixActuelFcfa.toLocaleString("fr-FR")} FCFA` : null;

          const decalage = DECALAGES_ETIQUETTE[position.nom] ?? { x: 0, y: 0 };

          return (
            <button
              key={position.nom}
              type="button"
              disabled={!snapshot}
              onClick={() => snapshot && onSelectionner(snapshot.regionId)}
              aria-pressed={selectionnee}
              aria-label={`${position.nom}${prixTexte ? ` — ${prixTexte}` : ""}`}
              className={clsx(
                "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                snapshot ? "cursor-pointer" : "cursor-default opacity-40",
              )}
              style={{
                left: `${(position.x / LARGEUR_VUE_SENEGAL) * 100}%`,
                top: `${(position.y / HAUTEUR_VUE_SENEGAL) * 100}%`,
              }}
            >
              <span
                className={clsx(
                  "block rounded-full transition-transform",
                  snapshot && "group-hover:scale-125",
                  selectionnee ? "h-4 w-4" : "h-3 w-3",
                )}
                style={{
                  backgroundColor: couleur,
                  boxShadow: selectionnee ? `0 0 0 3px white, 0 0 0 5px ${couleur}` : "0 0 0 2px white",
                }}
              />

              {/* Nom de région : ancré sous le repère mais légèrement décalé pour
                  les régions trop rapprochées (voir DECALAGES_ETIQUETTE), sans
                  déplacer le repère lui-même. Le prix de la sélection est
                  affiché à part, dans le bandeau au-dessus de la carte. */}
              <span
                className="absolute left-1/2 top-full pt-1"
                style={{ transform: `translate(calc(-50% + ${decalage.x}px), ${decalage.y}px)` }}
              >
                <span
                  className={clsx(
                    "whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight shadow-sm transition-colors",
                    selectionnee ? "bg-header text-white" : "bg-white text-header/70 group-hover:bg-header/5",
                  )}
                >
                  {position.nom}
                </span>
              </span>

              {snapshot && (
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max -translate-x-1/2 rounded-lg bg-header px-2.5 py-1.5 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="block text-[11px] font-bold text-white">{prixTexte ?? "—"}</span>
                  {snapshot.variationMensuellePourcent != null && (
                    <span
                      className={clsx(
                        "block text-[10px] font-semibold",
                        classeTexteVariationSurFondSombre(snapshot.variationMensuellePourcent),
                      )}
                    >
                      {snapshot.variationMensuellePourcent > 0 ? "+" : ""}
                      {snapshot.variationMensuellePourcent.toFixed(1)}% ce mois-ci
                    </span>
                  )}
                </span>
              )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
