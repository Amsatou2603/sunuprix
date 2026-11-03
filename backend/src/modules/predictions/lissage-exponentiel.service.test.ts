import { describe, expect, it } from "vitest";
import { genererPrediction, predireValeur, PERIODE_SAISONNIERE } from "./lissage-exponentiel.service";

describe("genererPrediction — secours lissage exponentiel double (historique court)", () => {
  it("retrouve une tendance linéaire parfaite sans bruit", () => {
    // y = 100 + 10x sur 10 points (< 24, donc secours double, pas de saisonnalité à estimer).
    const points = Array.from({ length: 10 }, (_, x) => ({ x, y: 100 + 10 * x }));

    const resultat = genererPrediction(points);

    expect(resultat.methode).toBe("LISSAGE_EXPONENTIEL_DOUBLE");
    expect(resultat.saisonniers).toBeNull();
    // Prédiction au point suivant (x=10) : doit rester proche de 100 + 10*10 = 200.
    const prediction = predireValeur(resultat, 1, points.length);
    expect(prediction).toBeGreaterThan(170);
    expect(prediction).toBeLessThan(230);
    expect(resultat.margeErreur).toBeLessThan(5);
  });

  it("lève une erreur avec moins de deux points", () => {
    expect(() => genererPrediction([{ x: 0, y: 100 }])).toThrow();
    expect(() => genererPrediction([])).toThrow();
  });
});

describe("genererPrediction — Holt-Winters additif (historique saisonnier suffisant)", () => {
  function serieSaisonniereSynthetique(nombreMois: number, niveauDepart: number, tendanceMensuelle: number, amplitudeSaisonniere: number) {
    // Saisonnalité sinusoïdale simple sur 12 mois, plus tendance linéaire, sans bruit —
    // un modèle qui capture correctement la saisonnalité doit s'en approcher de près.
    return Array.from({ length: nombreMois }, (_, x) => {
      const saison = amplitudeSaisonniere * Math.sin((2 * Math.PI * (x % PERIODE_SAISONNIERE)) / PERIODE_SAISONNIERE);
      return { x, y: niveauDepart + tendanceMensuelle * x + saison };
    });
  }

  it("bascule sur Holt-Winters dès que deux cycles complets de 12 points sont disponibles", () => {
    const points = serieSaisonniereSynthetique(24, 1000, 5, 80);

    const resultat = genererPrediction(points);

    expect(resultat.methode).toBe("HOLT_WINTERS_ADDITIF");
    expect(resultat.saisonniers).not.toBeNull();
    expect(resultat.saisonniers).toHaveLength(PERIODE_SAISONNIERE);
    expect(resultat.periode).toBe(PERIODE_SAISONNIERE);
  });

  it("produit une prédiction sensiblement meilleure qu'une simple extrapolation de tendance sur un produit saisonnier marqué", () => {
    // Amplitude saisonnière volontairement large par rapport à la tendance, pour qu'ignorer
    // la saisonnalité (comme le ferait une régression linéaire) produise une erreur nette.
    const points = serieSaisonniereSynthetique(36, 1000, 3, 150);
    const dernierIndice = points.length;
    const phaseCible = dernierIndice % PERIODE_SAISONNIERE;
    const valeurReelleAttendue =
      1000 + 3 * dernierIndice + 150 * Math.sin((2 * Math.PI * phaseCible) / PERIODE_SAISONNIERE);

    const resultat = genererPrediction(points);
    const prediction = predireValeur(resultat, 1, dernierIndice);

    const tendanceSeule = resultat.niveauFinal + resultat.tendanceFinale; // ce que donnerait le modèle sans sa composante saisonnière
    const erreurAvecSaisonnalite = Math.abs(prediction - valeurReelleAttendue);
    const erreurSansSaisonnalite = Math.abs(tendanceSeule - valeurReelleAttendue);

    expect(erreurAvecSaisonnalite).toBeLessThan(erreurSansSaisonnalite);
  });

  it("la marge d'erreur reste faible sur une série saisonnière sans bruit, une fois le modèle stabilisé", () => {
    const points = serieSaisonniereSynthetique(36, 1000, 2, 60);
    const resultat = genererPrediction(points);

    expect(resultat.margeErreur).toBeLessThan(30);
  });
});
