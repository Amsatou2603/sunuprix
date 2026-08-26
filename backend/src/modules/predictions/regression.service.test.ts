import { describe, expect, it } from "vitest";
import { calculerRegressionLineairePonderee, predireValeur } from "./regression.service";

describe("calculerRegressionLineairePonderee", () => {
  it("retrouve exactement la pente et l'ordonnée d'une droite parfaite (marge d'erreur nulle)", () => {
    // y = 100 + 10x, sans aucun bruit : la régression doit retomber exactement dessus.
    const points = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 100 + 10 * x }));

    const resultat = calculerRegressionLineairePonderee(points);

    expect(resultat.pente).toBeCloseTo(10, 6);
    expect(resultat.ordonneeOrigine).toBeCloseTo(100, 6);
    expect(resultat.margeErreur).toBeCloseTo(0, 6);
  });

  it("donne plus de poids aux points récents qu'à une régression non pondérée", () => {
    // Tendance qui s'accélère nettement sur la fin de la série : une régression
    // pondérée vers la récence doit produire une pente plus proche de la
    // tendance récente qu'une régression classique (nécessairement < 10 ici,
    // car la portion ancienne de la série est plate).
    const points = [
      { x: 0, y: 100 },
      { x: 1, y: 100 },
      { x: 2, y: 100 },
      { x: 3, y: 110 },
      { x: 4, y: 120 },
      { x: 5, y: 130 },
    ];

    const resultat = calculerRegressionLineairePonderee(points);

    // Pente non pondérée théorique (moindres carrés classiques) pour comparaison.
    const n = points.length;
    const moyenneX = points.reduce((s, p) => s + p.x, 0) / n;
    const moyenneY = points.reduce((s, p) => s + p.y, 0) / n;
    const numerateur = points.reduce((s, p) => s + (p.x - moyenneX) * (p.y - moyenneY), 0);
    const denominateur = points.reduce((s, p) => s + (p.x - moyenneX) ** 2, 0);
    const penteNonPonderee = numerateur / denominateur;

    expect(resultat.pente).toBeGreaterThan(penteNonPonderee);
  });

  it("produit une marge d'erreur strictement positive quand les points ne sont pas parfaitement alignés", () => {
    const points = [
      { x: 0, y: 400 },
      { x: 1, y: 420 },
      { x: 2, y: 405 },
      { x: 3, y: 440 },
      { x: 4, y: 430 },
    ];

    const resultat = calculerRegressionLineairePonderee(points);

    expect(resultat.margeErreur).toBeGreaterThan(0);
  });

  it("lève une erreur avec moins de deux points", () => {
    expect(() => calculerRegressionLineairePonderee([{ x: 0, y: 100 }])).toThrow();
    expect(() => calculerRegressionLineairePonderee([])).toThrow();
  });
});

describe("predireValeur", () => {
  it("projette la valeur attendue au rang chronologique donné", () => {
    const resultat = { pente: 5, ordonneeOrigine: 200, margeErreur: 3 };

    expect(predireValeur(resultat, 0)).toBe(200);
    expect(predireValeur(resultat, 10)).toBe(250);
  });
});
