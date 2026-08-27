"use client";

import Link from "next/link";
import type { SnapshotRegion } from "@/lib/api/types";

/**
 * Positions schématiques (en %), dérivées des mêmes proportions que
 * `CarteRegions` (viewBox 300x420) — pour rester visuellement cohérent avec
 * la carte régionale utilisée ailleurs dans l'app, sans dépendre d'un fond
 * de carte géographique externe.
 */
const POSITIONS: { nom: string; left: number; top: number }[] = [
  { nom: "Saint-Louis", left: 66.7, top: 16.7 },
  { nom: "Louga", left: 70, top: 38.1 },
  { nom: "Dakar", left: 18.3, top: 52.4 },
  { nom: "Thiès", left: 58.3, top: 60.7 },
  { nom: "Kaolack", left: 75, top: 84.5 },
];

/** Mêmes couleurs sémantiques que `CarteRegions` (hausse / baisse / stable / inconnu), adaptées en points lumineux sur fond sombre. */
function styleVariation(variation: number | null): { point: string; lueur: string; texte: string } {
  if (variation === null) return { point: "bg-white/30", lueur: "", texte: "text-white/50" };
  if (variation > 0) return { point: "bg-accent", lueur: "shadow-[0_0_14px_4px_rgba(239,159,39,0.55)]", texte: "text-accent-light" };
  if (variation < 0) return { point: "bg-red-500", lueur: "shadow-[0_0_14px_4px_rgba(239,68,68,0.5)]", texte: "text-red-300" };
  return { point: "bg-primary-light", lueur: "shadow-[0_0_14px_4px_rgba(21,149,111,0.55)]", texte: "text-primary-light" };
}

interface ProprietesCarteApercuAccueil {
  connecte: boolean;
  chargement: boolean;
  snapshots: SnapshotRegion[];
  produitNom?: string;
}

/**
 * Aperçu stylisé (non géographiquement exact, à l'image de `CarteRegions`)
 * des 5 régions suivies par SunuPrix, en points lumineux glassmorphism sur
 * fond sombre — pensé pour le héros de la page d'accueil. Données réelles
 * pour un visiteur connecté ; sinon, incitation à se connecter plutôt que
 * des valeurs inventées.
 */
export function CarteApercuAccueil({ connecte, chargement, snapshots, produitNom }: ProprietesCarteApercuAccueil) {
  return (
    <div className="verre-sombre relative aspect-[4/5] w-full max-w-sm overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#00C49F_1px,transparent_1px)] [background-size:22px_22px] opacity-10" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 mb-1 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Carte en direct</p>
        {connecte && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary-light">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-light" />
            {produitNom ?? "…"}
          </span>
        )}
      </div>

      <div className="relative z-10 h-[calc(100%-2.5rem)] w-full">
        {POSITIONS.map((position) => {
          const snapshot = connecte
            ? snapshots.find((s) => s.region === position.nom)
            : undefined;
          const { point, lueur, texte } = styleVariation(snapshot?.variationMensuellePourcent ?? null);

          return (
            <div
              key={position.nom}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              <span
                className={`block h-3 w-3 rounded-full ${connecte ? point : "bg-white/20"} ${
                  connecte && snapshot ? `animate-lueur-pulse ${lueur}` : ""
                }`}
              />
              <span className="mt-1 block whitespace-nowrap text-[9px] font-semibold text-white/70">
                {position.nom}
              </span>

              {connecte && snapshot && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl border border-white/10 bg-[#041B13]/95 px-3 py-1.5 text-center opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#041B13]/70 p-6 text-center backdrop-blur-sm">
          <span className="text-2xl">🔒</span>
          <p className="text-xs font-semibold text-white">Carte régionale en direct</p>
          <p className="max-w-[16rem] text-[11px] leading-relaxed text-white/60">
            Connectez-vous pour voir les prix réels par région, mis à jour à partir des relevés du terrain.
          </p>
          <Link href="/connexion" className="bouton-verre mt-1 px-5 py-2 text-xs">
            Se connecter
          </Link>
        </div>
      )}
    </div>
  );
}
