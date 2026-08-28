"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { CONTOUR_SENEGAL, LARGEUR_VUE_SENEGAL, HAUTEUR_VUE_SENEGAL } from "@/lib/senegal-map";

/**
 * Écran de démarrage plein écran, affiché pendant la toute première
 * vérification de session (`chargementInitial` dans AuthContext) — c'est-à-
 * dire à chaque chargement/actualisation complète de page, jamais lors d'une
 * navigation interne (celle-ci ne remonte pas AuthProvider).
 *
 * Objectif : couvrir ce court instant de vérification par un écran de marque
 * plutôt que par un flash de contenu (barre de nav sans utilisateur, page
 * vide, etc.) qui peut donner l'impression trompeuse d'être déconnecté.
 *
 * Important : ceci ne restaure pas une session absente — si le cookie de
 * session n'atteint réellement pas le navigateur (cf. le correctif du proxy
 * /api/* pour Safari/iOS), l'utilisateur atterrira quand même sur /connexion
 * une fois cet écran terminé. Cet écran ne fait qu'habiller l'attente.
 */

/** Trois régions mises en avant, mêmes couleurs sémantiques que le reste de l'app. */
const REGIONS_MISES_EN_AVANT: Array<{ nom: string; x: number; y: number; couleur: string }> = [
  { nom: "Saint-Louis", x: 122.8, y: 94.0, couleur: "#15956F" },
  { nom: "Thiès", x: 66.9, y: 170.9, couleur: "#F5B75A" },
  { nom: "Dakar", x: 35.5, y: 177.2, couleur: "#DC2626" },
];

/** Poussière d'étoiles décorative — positions fixes (jamais `Math.random()` au rendu,
 *  pour rester identique entre le rendu serveur et l'hydratation client). */
const ETOILES: Array<{ x: number; y: number; taille: number; opacite: number }> = [
  { x: 8, y: 12, taille: 2, opacite: 0.5 },
  { x: 18, y: 28, taille: 1.5, opacite: 0.35 },
  { x: 27, y: 8, taille: 1.5, opacite: 0.4 },
  { x: 6, y: 45, taille: 2, opacite: 0.3 },
  { x: 33, y: 52, taille: 1.5, opacite: 0.45 },
  { x: 14, y: 66, taille: 2, opacite: 0.3 },
  { x: 40, y: 20, taille: 1.5, opacite: 0.35 },
  { x: 90, y: 15, taille: 2, opacite: 0.4 },
  { x: 82, y: 32, taille: 1.5, opacite: 0.3 },
  { x: 93, y: 48, taille: 2, opacite: 0.45 },
  { x: 76, y: 60, taille: 1.5, opacite: 0.3 },
  { x: 88, y: 72, taille: 2, opacite: 0.35 },
  { x: 60, y: 10, taille: 1.5, opacite: 0.3 },
  { x: 68, y: 85, taille: 1.5, opacite: 0.3 },
  { x: 22, y: 82, taille: 2, opacite: 0.35 },
];

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-header px-6"
      role="status"
      aria-live="polite"
      aria-label="Chargement de SunuPrix en cours"
    >
      {/* Fond dégradé sombre + poussière d'étoiles, façon ciel nocturne. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 32%, rgba(21,149,111,0.4), transparent 62%), linear-gradient(180deg, #04140F 0%, #08251B 55%, #04140F 100%)",
        }}
      />
      {ETOILES.map((etoile, indice) => (
        <span
          key={indice}
          className="pointer-events-none absolute rounded-full bg-white"
          style={{
            left: `${etoile.x}%`,
            top: `${etoile.y}%`,
            width: etoile.taille,
            height: etoile.taille,
            opacity: etoile.opacite,
          }}
        />
      ))}

      {/* Contour du Sénégal, en filigrane derrière le blason. */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] w-[min(34rem,140vw)] -translate-x-1/2 -translate-y-1/2 opacity-[0.35] sm:top-[26%]">
        <svg
          viewBox={`0 0 ${LARGEUR_VUE_SENEGAL} ${HAUTEUR_VUE_SENEGAL}`}
          className="h-auto w-full"
          role="presentation"
        >
          <polygon
            points={CONTOUR_SENEGAL}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {REGIONS_MISES_EN_AVANT.map((region) => (
            <circle
              key={region.nom}
              cx={region.x}
              cy={region.y}
              r={4}
              fill={region.couleur}
              className="animate-lueur-pulse"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
        </svg>
        {REGIONS_MISES_EN_AVANT.map((region) => (
          <span
            key={region.nom}
            className="absolute -translate-x-1/2 translate-y-2 whitespace-nowrap text-[10px] font-medium text-white/60 sm:text-xs"
            style={{
              left: `${(region.x / LARGEUR_VUE_SENEGAL) * 100}%`,
              top: `${(region.y / HAUTEUR_VUE_SENEGAL) * 100}%`,
            }}
          >
            {region.nom}
          </span>
        ))}
      </div>

      {/* Blason lumineux + nom de l'app. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-6 h-32 w-32 sm:h-40 sm:w-40">
          <div
            className="absolute inset-[-35%] animate-lueur-pulse rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(21,149,111,0.75) 0%, rgba(21,149,111,0.18) 45%, transparent 72%)",
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
          <Image
            src="/design/icon.svg"
            alt="SunuPrix"
            fill
            priority
            sizes="160px"
            className="relative object-contain drop-shadow-[0_0_40px_rgba(21,149,111,0.6)]"
          />
        </div>

        <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Sunu<span className="bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">Prix</span>
        </h1>
        <p className="mt-2 text-center text-sm text-white/60 sm:text-base">
          Suivi intelligent de l&apos;inflation au Sénégal
        </p>

        {/* Indicateur de chargement. */}
        <div className="mt-9 flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-primary-light" />
          <p className="text-xs font-medium text-white/50 sm:text-sm">Chargement en cours…</p>
        </div>

        {/* Barre de progression indéterminée. */}
        <div className="mt-5 h-1 w-56 overflow-hidden rounded-full bg-white/10 sm:w-64">
          <span className="block h-full w-1/3 animate-barre-chargement rounded-full bg-gradient-to-r from-primary-light to-accent-light" />
        </div>

        {/* Bandeau de confiance. */}
        <div className="mt-8 flex items-center gap-1.5 text-[11px] text-white/45 sm:text-xs">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary-light" strokeWidth={1.75} />
          <span>Données fiables&nbsp;•&nbsp;Analyses précises&nbsp;•&nbsp;Décisions éclairées</span>
        </div>
      </motion.div>
    </div>
  );
}
