/**
 * Moteur de prédiction : lissage exponentiel de Holt-Winters (additif), avec
 * secours automatique vers un lissage exponentiel double (Holt, sans
 * composante saisonnière) quand l'historique disponible ne couvre pas assez
 * de cycles pour estimer une saisonnalité de façon fiable.
 *
 * Remplace l'ancienne régression linéaire pondérée (voir git history —
 * `regression.service.ts`), à la suite d'un retour de l'encadreur académique
 * suggérant un modèle plus adapté à ce type de série. La régression linéaire
 * pondérée avait déjà été documentée comme explicitement limitée sur un
 * point précis (mémoire, chapitre Données, "Évaluation du modèle et limites
 * assumées", limite n°2) : elle ne capture pas la saisonnalité infra-
 * annuelle, pourtant réelle pour plusieurs produits suivis (oignon, pomme de
 * terre, tomate, mil...). Le lissage exponentiel triple (Holt-Winters)
 * répond directement à cette limite en modélisant explicitement trois
 * composantes — niveau, tendance, saisonnalité — plutôt qu'une seule droite.
 *
 * Choix méthodologique délibéré : rester sur une famille de modèles
 * statistiques classiques et intégralement explicables (trois équations de
 * récurrence, aucun paramètre caché), dans la même logique que le choix
 * initial de la régression — jamais un modèle d'apprentissage automatique
 * opaque pour ce module. Les coefficients de lissage (alpha, beta, gamma)
 * sont choisis par une recherche en grille qui minimise l'erreur quadratique
 * pondérée par la récence (même philosophie de pondération que l'ancien
 * modèle), plutôt que fixés arbitrairement.
 *
 * Fonctions pures, sans accès aux données ni au réseau — testables
 * unitairement en isolation.
 */

export interface PointSerie {
  /** Rang chronologique du point (0 = plus ancien). */
  x: number;
  /** Valeur observée (prix en FCFA). */
  y: number;
}

export type MethodeLissage = "HOLT_WINTERS_ADDITIF" | "LISSAGE_EXPONENTIEL_DOUBLE";

export interface ResultatLissage {
  methode: MethodeLissage;
  niveauFinal: number;
  tendanceFinale: number;
  /** Indices saisonniers additifs (longueur = periode), ou null si le secours double a été utilisé. */
  saisonniers: number[] | null;
  /** Longueur du cycle saisonnier retenu (12 = mensuel), ou null si non applicable. */
  periode: number | null;
  alpha: number;
  beta: number;
  gamma: number | null;
  /** Écart-type pondéré des résidus en une étape — utilisé comme marge d'erreur de la prédiction. */
  margeErreur: number;
}

/** Cycle saisonnier retenu : mensuel, cohérent avec la cadence des relevés (voir mémoire, chapitre Données). */
export const PERIODE_SAISONNIERE = 12;

/** Nombre minimal de points pour tenter une estimation saisonnière fiable (2 cycles complets). */
const MINIMUM_POUR_SAISONNALITE = PERIODE_SAISONNIERE * 2;

const GRILLE_ALPHA = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const GRILLE_BETA = [0.05, 0.1, 0.2, 0.3];
const GRILLE_GAMMA = [0.1, 0.2, 0.3, 0.4];

function erreurQuadratiquePondereeMoyenne(residus: { residu: number; poids: number }[]): number {
  let sommePoids = 0;
  let sommePoidsCarres = 0;
  for (const { residu, poids } of residus) {
    sommePoids += poids;
    sommePoidsCarres += poids * residu * residu;
  }
  return sommePoids === 0 ? 0 : sommePoidsCarres / sommePoids;
}

/**
 * Lissage exponentiel double (Holt) : niveau + tendance, sans saisonnalité.
 * Utilisé en secours quand l'historique est trop court pour une estimation
 * saisonnière fiable (moins de deux cycles complets de 12 points).
 */
function lisserDouble(points: PointSerie[], alpha: number, beta: number) {
  const valeurs = points.map((p) => p.y);
  let niveau = valeurs[0];
  let tendance = valeurs[1] - valeurs[0];
  const residusPolides: { residu: number; poids: number }[] = [];

  for (let t = 0; t < valeurs.length; t += 1) {
    const niveauPrecedent = niveau;
    const tendancePrecedente = tendance;
    const prevision = niveauPrecedent + tendancePrecedente;
    const y = valeurs[t];

    niveau = alpha * y + (1 - alpha) * (niveauPrecedent + tendancePrecedente);
    tendance = beta * (niveau - niveauPrecedent) + (1 - beta) * tendancePrecedente;

    // Le tout premier résidu (t=0) compare au point de départ lui-même et
    // n'est pas significatif ; on ne l'inclut pas dans la marge d'erreur.
    if (t > 0) {
      residusPolides.push({ residu: y - prevision, poids: t + 1 });
    }
  }

  return { niveau, tendance, residusPolides };
}

/**
 * Lissage exponentiel triple (Holt-Winters additif) : niveau + tendance +
 * saisonnalité. Initialisation par moyenne des deux premiers cycles
 * complets, puis mise à jour récursive sur l'ensemble de la série.
 */
function lisserTriple(points: PointSerie[], alpha: number, beta: number, gamma: number, periode: number) {
  const valeurs = points.map((p) => p.y);
  const n = valeurs.length;
  const nombreCycles = Math.floor(n / periode);

  const moyenneCycle = (indiceCycle: number) => {
    let somme = 0;
    for (let i = 0; i < periode; i += 1) somme += valeurs[indiceCycle * periode + i];
    return somme / periode;
  };

  const moyenneCycle0 = moyenneCycle(0);
  const moyenneCycle1 = moyenneCycle(1);

  let niveau = moyenneCycle0;
  let tendance = (moyenneCycle1 - moyenneCycle0) / periode;

  // Indices saisonniers initiaux : moyenne, sur tous les cycles complets
  // disponibles, de l'écart entre chaque point et la moyenne de son cycle —
  // puis recentrage pour que la somme des indices sur une période soit nulle
  // (condition standard du modèle additif).
  const saisonniers = new Array<number>(periode).fill(0);
  for (let i = 0; i < periode; i += 1) {
    let somme = 0;
    for (let c = 0; c < nombreCycles; c += 1) {
      somme += valeurs[c * periode + i] - moyenneCycle(c);
    }
    saisonniers[i] = somme / nombreCycles;
  }
  const moyenneSaisonniers = saisonniers.reduce((s, v) => s + v, 0) / periode;
  for (let i = 0; i < periode; i += 1) saisonniers[i] -= moyenneSaisonniers;

  const residusPolides: { residu: number; poids: number }[] = [];

  for (let t = 0; t < n; t += 1) {
    const phase = t % periode;
    const niveauPrecedent = niveau;
    const tendancePrecedente = tendance;
    const saisonPrecedente = saisonniers[phase];
    const prevision = niveauPrecedent + tendancePrecedente + saisonPrecedente;
    const y = valeurs[t];

    niveau = alpha * (y - saisonPrecedente) + (1 - alpha) * (niveauPrecedent + tendancePrecedente);
    tendance = beta * (niveau - niveauPrecedent) + (1 - beta) * tendancePrecedente;
    saisonniers[phase] = gamma * (y - niveau) + (1 - gamma) * saisonPrecedente;

    // On exclut le premier cycle du calcul de la marge d'erreur : c'est la
    // période de "rodage" de l'initialisation, ses résidus sont
    // structurellement plus bruités et ne reflètent pas la qualité du modèle
    // une fois stabilisé (même logique que l'exclusion du tout premier point
    // dans le lissage double ci-dessus).
    if (t >= periode) {
      residusPolides.push({ residu: y - prevision, poids: t + 1 });
    }
  }

  return { niveau, tendance, saisonniers, residusPolides };
}

/**
 * Calcule la meilleure prédiction disponible pour une série chronologique de
 * prix validés, en choisissant automatiquement entre Holt-Winters (si assez
 * d'historique pour estimer une saisonnalité sur deux cycles complets) et
 * son secours sans saisonnalité (Holt simple), puis en sélectionnant par
 * recherche en grille les coefficients de lissage qui minimisent l'erreur
 * quadratique pondérée par la récence.
 */
export function genererPrediction(points: PointSerie[]): ResultatLissage {
  if (points.length < 2) {
    throw new Error("Au moins deux points sont nécessaires pour calculer une prédiction.");
  }

  if (points.length >= MINIMUM_POUR_SAISONNALITE) {
    let meilleur: { alpha: number; beta: number; gamma: number; erreur: number; resultat: ReturnType<typeof lisserTriple> } | null = null;
    for (const alpha of GRILLE_ALPHA) {
      for (const beta of GRILLE_BETA) {
        for (const gamma of GRILLE_GAMMA) {
          const resultat = lisserTriple(points, alpha, beta, gamma, PERIODE_SAISONNIERE);
          const erreur = erreurQuadratiquePondereeMoyenne(resultat.residusPolides);
          if (!meilleur || erreur < meilleur.erreur) {
            meilleur = { alpha, beta, gamma, erreur, resultat };
          }
        }
      }
    }
    // points.length >= 2 garantit toujours au moins une itération de boucle ci-dessus.
    const { alpha, beta, gamma, resultat } = meilleur!;
    return {
      methode: "HOLT_WINTERS_ADDITIF",
      niveauFinal: resultat.niveau,
      tendanceFinale: resultat.tendance,
      saisonniers: resultat.saisonniers,
      periode: PERIODE_SAISONNIERE,
      alpha,
      beta,
      gamma,
      margeErreur: Math.sqrt(erreurQuadratiquePondereeMoyenne(resultat.residusPolides)),
    };
  }

  let meilleur: { alpha: number; beta: number; erreur: number; resultat: ReturnType<typeof lisserDouble> } | null = null;
  for (const alpha of GRILLE_ALPHA) {
    for (const beta of GRILLE_BETA) {
      const resultat = lisserDouble(points, alpha, beta);
      const erreur = erreurQuadratiquePondereeMoyenne(resultat.residusPolides);
      if (!meilleur || erreur < meilleur.erreur) {
        meilleur = { alpha, beta, erreur, resultat };
      }
    }
  }
  const { alpha, beta, resultat } = meilleur!;
  return {
    methode: "LISSAGE_EXPONENTIEL_DOUBLE",
    niveauFinal: resultat.niveau,
    tendanceFinale: resultat.tendance,
    saisonniers: null,
    periode: null,
    alpha,
    beta,
    gamma: null,
    margeErreur: Math.sqrt(erreurQuadratiquePondereeMoyenne(resultat.residusPolides)),
  };
}

/**
 * Projette la prédiction `pasEnAvant` périodes après le dernier point
 * observé (1 = le mois suivant, cas d'usage unique de l'application).
 *
 * `indiceAbsoluPointPredit` est le rang chronologique du point prédit
 * (c.-à-d. `points.length - 1 + pasEnAvant` du point de vue de l'appelant) :
 * nécessaire pour retrouver la bonne phase saisonnière, puisque `resultat`
 * ne conserve que l'état final du modèle, pas la série d'origine.
 */
export function predireValeur(resultat: ResultatLissage, pasEnAvant: number, indiceAbsoluPointPredit: number): number {
  const base = resultat.niveauFinal + pasEnAvant * resultat.tendanceFinale;
  if (resultat.saisonniers && resultat.periode) {
    const phase = ((indiceAbsoluPointPredit % resultat.periode) + resultat.periode) % resultat.periode;
    return base + resultat.saisonniers[phase];
  }
  return base;
}
