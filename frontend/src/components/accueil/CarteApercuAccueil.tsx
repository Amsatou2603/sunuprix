"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { SnapshotRegion } from "@/lib/api/types";
import {
  CONTOUR_SENEGAL,
  POSITIONS_REGIONS as POSITIONS,
  LARGEUR_VUE_SENEGAL as LARGEUR_VUE,
  HAUTEUR_VUE_SENEGAL as HAUTEUR_VUE,
} from "@/lib/senegal-map";

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
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <Lock className="h-5 w-5" strokeWidth={1.75} />
          </span>
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
