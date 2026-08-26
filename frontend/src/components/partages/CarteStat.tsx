import type { ReactNode } from "react";

interface ProprietesCarteStat {
  icone: string;
  label: string;
  valeur: ReactNode;
  /** Pastille de contexte optionnelle (delta, statut...), affichée en haut à droite de la carte. */
  pastille?: ReactNode;
  /** Couleur de fond du badge d'icône (classes Tailwind), vert par défaut. */
  couleurIcone?: string;
}

/**
 * Carte de statistique compacte (icône dans un badge coloré + libellé +
 * valeur en gros + pastille de contexte), utilisée en tête des tableaux de
 * bord par rôle (admin, chercheur, vendeur, ministère) — un seul composant
 * pour ce motif répété plutôt qu'une mise en page recopiée à chaque page.
 */
export function CarteStat({ icone, label, valeur, pastille, couleurIcone = "bg-primary/10" }: ProprietesCarteStat) {
  return (
    <div className="carte">
      <div className="flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${couleurIcone}`} aria-hidden="true">
          {icone}
        </span>
        {pastille}
      </div>
      <p className="mt-3 text-2xl font-bold text-header">{valeur}</p>
      <p className="mt-0.5 text-xs font-medium text-header/50">{label}</p>
    </div>
  );
}
