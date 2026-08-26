interface ProprietesBadgeVariation {
  valeur: number | null;
  /** Texte ajouté après le pourcentage, ex. "ce mois". */
  suffixe?: string;
}

/**
 * Badge de variation réutilisé partout où une variation de prix est
 * affichée (synthèse régionale, tableaux admin/ministère, tooltips de
 * graphique) : doré pour une hausse, rouge pour une baisse, neutre si aucune
 * donnée ne permet de la calculer — jamais de couleur ou de flèche
 * recalculée à la main à chaque endroit.
 */
export function BadgeVariation({ valeur, suffixe }: ProprietesBadgeVariation) {
  if (valeur === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-header/50">
        Pas d&apos;historique
      </span>
    );
  }

  const hausse = valeur >= 0;
  const fleche = valeur === 0 ? "→" : hausse ? "↑" : "↓";
  return (
    <span className={hausse ? "badge-hausse" : "badge-baisse"}>
      {fleche} {hausse && valeur > 0 ? "+" : ""}
      {valeur}%{suffixe ? ` ${suffixe}` : ""}
    </span>
  );
}
