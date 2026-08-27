"use client";

import Link from "next/link";
import type { SnapshotRegion } from "@/lib/api/types";

/**
 * Contour du Sénégal, dans un viewBox 440x380 — dérivé du tracé réel du
 * pays (simplifié pour rester léger), pas d'une forme inventée : on
 * retrouve la presqu'île de Dakar à l'ouest, l'échancrure de la Gambie au
 * sud, et la queue sud-est vers Kédougou.
 */
const CONTOUR_SENEGAL =
  "354.5,171.3 360.3,181.5 357.8,193.5 370.7,209.5 370.6,224.2 374.3,230.5 368.5,245.7 382.3,265.8 386.8,260.8 394.4,262.4 409.5,289.3 405.8,313.5 410.0,318.4 409.6,323.1 369.2,323.5 353.9,327.9 322.6,320.1 314.4,315.1 306.3,317.7 305.0,308.7 174.5,305.8 151.1,317.7 134.7,321.0 115.9,319.8 92.6,326.6 80.9,326.2 76.4,318.8 77.9,315.5 97.5,310.2 87.9,303.6 81.5,310.6 78.9,311.7 77.4,309.1 77.7,281.6 84.8,276.0 135.1,275.8 136.3,265.2 168.9,260.7 177.3,250.6 206.9,263.5 233.1,270.8 257.8,264.5 259.0,260.0 257.4,255.5 249.7,251.4 223.3,253.9 190.5,236.1 179.9,234.4 160.2,239.8 155.1,248.7 90.1,248.6 88.5,242.2 77.5,228.6 86.7,220.0 75.9,222.3 75.6,216.7 64.7,197.0 58.2,192.0 52.7,182.0 41.7,176.4 37.2,176.7 35.6,181.3 30.0,174.7 54.0,164.1 72.8,140.5 89.6,112.4 97.6,82.4 110.1,61.5 139.1,64.5 179.1,56.9 181.0,53.4 189.1,52.1 215.4,53.5 229.8,58.4 249.9,75.6 256.5,86.0 263.4,84.5 267.8,87.4 278.8,86.9 288.6,97.2 297.4,119.9 314.4,130.4 318.8,143.8 338.3,156.7 353.2,170.8";

/** Coordonnées (dans le même viewBox 440x380) des 5 régions suivies, dérivées de leurs coordonnées géographiques réelles projetées sur ce même tracé. */
const POSITIONS: { nom: string; x: number; y: number }[] = [
  { nom: "Saint-Louis", x: 122.8, y: 94.0 },
  { nom: "Louga", x: 110.6, y: 119.6 },
  { nom: "Dakar", x: 35.5, y: 177.2 },
  { nom: "Thiès", x: 66.9, y: 170.9 },
  { nom: "Kaolack", x: 119.8, y: 211.0 },
];

const LARGEUR_VUE = 440;
const HAUTEUR_VUE = 380;

/** Mêmes couleurs sémantiques que `CarteRegions` (hausse / baisse / stable / inconnu). */
function couleurVariation(variation: number | null): string {
  if (variation === null) return "rgba(255,255,255,0.35)";
  if (variation > 0) return "#EF9F27";
  if (variation < 0) return "#DC2626";
  return "#15956F";
}

function classeTexteVariation(variation: number | null): string {
  if (variation === null) return "text-white/50";
  if (variation > 0) return "text-accent-light";
  if (variation < 0) return "text-red-300";
  return "text-primary-light";
}

interface ProprietesCarteApercuAccueil {
  connecte: boolean;
  chargement: boolean;
  snapshots: SnapshotRegion[];
  produitNom?: string;
}

/**
 * Aperçu du contour du Sénégal, avec les 5 régions suivies par SunuPrix en
 * points lumineux glassmorphism, positionnées proportionnellement à leur
 * emplacement réel sur le territoire. Données réelles pour un visiteur
 * connecté ; sinon, incitation à se connecter plutôt que des valeurs
 * inventées.
 */
export function CarteApercuAccueil({ connecte, chargement, snapshots, produitNom }: ProprietesCarteApercuAccueil) {
  return (
    <div className="verre-sombre relative mx-auto flex w-[min(26rem,90vw)] flex-col overflow-hidden p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Carte en direct</p>
        {connecte && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary-light">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-light" />
            {produitNom ?? "…"}
          </span>
        )}
      </div>

      <div className="relative aspect-[440/380] w-full">
        <svg
          viewBox={`0 0 ${LARGEUR_VUE} ${HAUTEUR_VUE}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Contour du Sénégal avec les régions suivies par SunuPrix"
        >
          <polygon
            points={CONTOUR_SENEGAL}
            fill="rgba(255,255,255,0.07)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          {POSITIONS.map((position) => {
            const snapshot = connecte ? snapshots.find((s) => s.region === position.nom) : undefined;
            const couleur = connecte ? couleurVariation(snapshot?.variationMensuellePourcent ?? null) : "rgba(255,255,255,0.25)";
            const animer = connecte && !!snapshot;

            return (
              <g key={position.nom}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={9}
                  fill={couleur}
                  fillOpacity={0.35}
                  className={animer ? "animate-lueur-pulse" : ""}
                  style={animer ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
                />
                <circle cx={position.x} cy={position.y} r={4} fill={couleur} />
              </g>
            );
          })}
        </svg>

        {/* Étiquettes + info-bulles HTML, alignées sur les mêmes coordonnées proportionnelles que le SVG. */}
        {POSITIONS.map((position) => {
          const snapshot = connecte ? snapshots.find((s) => s.region === position.nom) : undefined;
          const texte = classeTexteVariation(snapshot?.variationMensuellePourcent ?? null);

          return (
            <div
              key={position.nom}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(position.x / LARGEUR_VUE) * 100}%`, top: `${(position.y / HAUTEUR_VUE) * 100}%` }}
            >
              <span className="mt-2 block translate-y-2 whitespace-nowrap text-[9px] font-semibold text-white/70">
                {position.nom}
              </span>

              {connecte && snapshot && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max -translate-x-1/2 rounded-xl border border-white/10 bg-primary-dark/95 px-3 py-1.5 text-center opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                  <p className="text-[11px] font-bold text-white">
                    {snapshot.prixActuelFcfa != null ? `${snapshot.prixActuelFcfa.toLocaleString("fr-FR")} FCFA` : "—"}
                  </p>
                  {snapshot.variationMensuellePourcent != null && (
                    <p className={`text-[10px] font-semibold ${texte}`}>
                      {snapshot.variationMensuellePourcent > 0 ? "+" : ""}
                      {snapshot.variationMensuellePourcent.toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!connecte && !chargement && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-primary-dark/80 p-6 text-center backdrop-blur-sm">
          <span className="text-2xl">🔒</span>
          <p className="text-sm font-semibold text-white">Carte régionale en direct</p>
          <p className="max-w-[17rem] text-xs leading-relaxed text-white/65">
            Connectez-vous pour voir les prix réels par région, mis à jour à partir des relevés du terrain.
          </p>
          <Link href="/connexion" className="bouton-verre mt-2 px-8 py-3 text-sm font-bold">
            Se connecter
          </Link>
        </div>
      )}
    </div>
  );
}
