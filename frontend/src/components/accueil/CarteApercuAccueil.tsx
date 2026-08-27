"use client";

import Link from "next/link";
import type { SnapshotRegion } from "@/lib/api/types";

/**
 * Contour stylisé du Sénégal (schématique, à l'image de `CarteRegions` —
 * "non géographiquement exacte" — mais dessiné pour rester reconnaissable :
 * presqu'île de Dakar à l'ouest, échancrure de la Gambie au sud, et la
 * queue sud-est vers Kédougou), dans un viewBox 440x380.
 */
const CONTOUR_SENEGAL =
  "95,45 150,20 230,28 310,45 375,68 415,95 400,150 378,215 350,280 300,325 240,335 175,320 130,300 110,275 130,250 150,240 330,225 330,205 150,192 135,170 110,135 60,115 15,100 55,85 75,65";

/** Coordonnées (dans le même viewBox 440x380) des 5 régions suivies, positionnées proportionnellement à leur emplacement réel sur le territoire. */
const POSITIONS: { nom: string; x: number; y: number }[] = [
  { nom: "Saint-Louis", x: 105, y: 60 },
  { nom: "Louga", x: 160, y: 105 },
  { nom: "Dakar", x: 45, y: 102 },
  { nom: "Thiès", x: 115, y: 128 },
  { nom: "Kaolack", x: 215, y: 195 },
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
    <div className="verre-sombre relative mx-auto flex w-[22rem] max-w-full flex-col overflow-hidden p-5 sm:w-[26rem] sm:p-6">
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
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max -translate-x-1/2 rounded-xl border border-white/10 bg-[#041B13]/95 px-3 py-1.5 text-center opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#041B13]/75 p-6 text-center backdrop-blur-sm">
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
