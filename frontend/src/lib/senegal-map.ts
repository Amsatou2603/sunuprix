/**
 * Contour du Sénégal (viewBox 440x380) et coordonnées des 5 régions suivies
 * par SunuPrix, projetées sur ce même tracé à partir de leurs coordonnées
 * géographiques réelles — dérivé du tracé réel du pays (simplifié pour
 * rester léger), pas d'une forme inventée : on retrouve la presqu'île de
 * Dakar à l'ouest, l'échancrure de la Gambie au sud, et la queue sud-est
 * vers Kédougou.
 *
 * Source unique partagée entre l'aperçu de la page d'accueil
 * (`CarteApercuAccueil`) et la carte interactive de la page Données
 * (`CarteRegions`), pour que les deux cartes représentent exactement la
 * même géographie.
 */

export const CONTOUR_SENEGAL =
  "354.5,171.3 360.3,181.5 357.8,193.5 370.7,209.5 370.6,224.2 374.3,230.5 368.5,245.7 382.3,265.8 386.8,260.8 394.4,262.4 409.5,289.3 405.8,313.5 410.0,318.4 409.6,323.1 369.2,323.5 353.9,327.9 322.6,320.1 314.4,315.1 306.3,317.7 305.0,308.7 174.5,305.8 151.1,317.7 134.7,321.0 115.9,319.8 92.6,326.6 80.9,326.2 76.4,318.8 77.9,315.5 97.5,310.2 87.9,303.6 81.5,310.6 78.9,311.7 77.4,309.1 77.7,281.6 84.8,276.0 135.1,275.8 136.3,265.2 168.9,260.7 177.3,250.6 206.9,263.5 233.1,270.8 257.8,264.5 259.0,260.0 257.4,255.5 249.7,251.4 223.3,253.9 190.5,236.1 179.9,234.4 160.2,239.8 155.1,248.7 90.1,248.6 88.5,242.2 77.5,228.6 86.7,220.0 75.9,222.3 75.6,216.7 64.7,197.0 58.2,192.0 52.7,182.0 41.7,176.4 37.2,176.7 35.6,181.3 30.0,174.7 54.0,164.1 72.8,140.5 89.6,112.4 97.6,82.4 110.1,61.5 139.1,64.5 179.1,56.9 181.0,53.4 189.1,52.1 215.4,53.5 229.8,58.4 249.9,75.6 256.5,86.0 263.4,84.5 267.8,87.4 278.8,86.9 288.6,97.2 297.4,119.9 314.4,130.4 318.8,143.8 338.3,156.7 353.2,170.8";

export interface PositionRegion {
  nom: string;
  x: number;
  y: number;
}

export const POSITIONS_REGIONS: PositionRegion[] = [
  { nom: "Saint-Louis", x: 122.8, y: 94.0 },
  { nom: "Louga", x: 110.6, y: 119.6 },
  { nom: "Dakar", x: 35.5, y: 177.2 },
  { nom: "Thiès", x: 66.9, y: 170.9 },
  { nom: "Kaolack", x: 119.8, y: 211.0 },
];

export const LARGEUR_VUE_SENEGAL = 440;
export const HAUTEUR_VUE_SENEGAL = 380;
