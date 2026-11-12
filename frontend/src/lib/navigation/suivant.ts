/**
 * Gestion du paramètre `?suivant=` : page vers laquelle revenir après une
 * connexion ou une inscription (ex. un visiteur qui voulait créer une alerte).
 *
 * Seuls les chemins internes sont acceptés (« /alertes », jamais
 * « //site-externe » ni « https://… ») pour éviter toute redirection ouverte.
 */
export function cheminSuivantValide(valeur: string | null | undefined): string | null {
  if (!valeur) return null;
  if (!valeur.startsWith("/") || valeur.startsWith("//") || valeur.startsWith("/\\")) return null;
  return valeur;
}

/** Lit `?suivant=` dans l'URL courante (côté client uniquement) ; « / » par défaut. */
export function lireCheminSuivant(): string {
  if (typeof window === "undefined") return "/";
  return cheminSuivantValide(new URLSearchParams(window.location.search).get("suivant")) ?? "/";
}

/** Construit un lien de connexion ou d'inscription qui ramène ensuite à `chemin`. */
export function lienAvecSuivant(page: "/connexion" | "/inscription", chemin: string | null | undefined): string {
  const suivant = cheminSuivantValide(chemin);
  return suivant && suivant !== "/" ? `${page}?suivant=${encodeURIComponent(suivant)}` : page;
}
