/**
 * Moteur de prédiction : régression linéaire pondérée.
 *
 * Fonction pure, sans accès aux données ni au réseau — testable
 * unitairement en isolation (voir la stratégie de test du plan
 * d'implémentation, phase 3). Les points les plus récents reçoivent un poids
 * plus important (poids = rang chronologique + 1), ce qui fait mieux réagir
 * la tendance calculée aux évolutions récentes qu'une régression classique
 * non pondérée, sans pour autant ignorer l'historique plus ancien.
 */

export interface PointRegression {
  /** Rang chronologique du point (0 = plus ancien). */
  x: number;
  /** Valeur observée (prix en FCFA). */
  y: number;
}

export interface ResultatRegression {
  pente: number;
  ordonneeOrigine: number;
  /** Écart-type pondéré des résidus — utilisé comme marge d'erreur de la prédiction. */
  margeErreur: number;
}

export function calculerRegressionLineairePonderee(points: PointRegression[]): ResultatRegression {
  if (points.length < 2) {
    throw new Error("Au moins deux points sont nécessaires pour calculer une régression.");
  }

  let sommePoids = 0;
  let sommePoidsX = 0;
  let sommePoidsY = 0;
  let sommePoidsXY = 0;
  let sommePoidsXX = 0;

  points.forEach((point, indice) => {
    const poids = indice + 1;
    sommePoids += poids;
    sommePoidsX += poids * point.x;
    sommePoidsY += poids * point.y;
    sommePoidsXY += poids * point.x * point.y;
    sommePoidsXX += poids * point.x * point.x;
  });

  const moyenneX = sommePoidsX / sommePoids;
  const moyenneY = sommePoidsY / sommePoids;

  const numerateur = sommePoidsXY - sommePoids * moyenneX * moyenneY;
  const denominateur = sommePoidsXX - sommePoids * moyenneX * moyenneX;
  const pente = denominateur === 0 ? 0 : numerateur / denominateur;
  const ordonneeOrigine = moyenneY - pente * moyenneX;

  let sommePoidsCarresResidus = 0;
  points.forEach((point, indice) => {
    const poids = indice + 1;
    const valeurPredite = ordonneeOrigine + pente * point.x;
    const residu = point.y - valeurPredite;
    sommePoidsCarresResidus += poids * residu * residu;
  });
  const margeErreur = Math.sqrt(sommePoidsCarresResidus / sommePoids);

  return { pente, ordonneeOrigine, margeErreur };
}

/** Projette la valeur du modèle à un rang chronologique donné (ex. le point suivant). */
export function predireValeur(resultat: ResultatRegression, x: number): number {
  return resultat.ordonneeOrigine + resultat.pente * x;
}
