/** Colonne d'un export CSV : clé lue dans chaque ligne + libellé d'en-tête. */
export interface ColonneCsv<T> {
  cle: keyof T;
  entete: string;
}

/** Échappe une valeur pour l'inclure dans un champ CSV (RFC 4180 simplifiée). */
function echapperValeurCsv(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "";
  const texte = String(valeur);
  if (/["\n,]/.test(texte)) {
    return `"${texte.replace(/"/g, '""')}"`;
  }
  return texte;
}

/**
 * Convertit un tableau d'objets en texte CSV, réutilisable pour tout export
 * (relevés de prix, prédictions, futurs exports) plutôt que de reconstruire
 * la sérialisation CSV à chaque endroit qui en a besoin.
 */
export function versCsv<T extends object>(lignes: T[], colonnes: ColonneCsv<T>[]): string {
  const entete = colonnes.map((colonne) => echapperValeurCsv(colonne.entete)).join(",");
  const corps = lignes
    .map((ligne) => colonnes.map((colonne) => echapperValeurCsv(ligne[colonne.cle])).join(","))
    .join("\n");
  return corps.length > 0 ? `${entete}\n${corps}\n` : `${entete}\n`;
}
