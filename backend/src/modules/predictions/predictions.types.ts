export interface PredictionPublique {
  id: string;
  produitId: string;
  regionId: string;
  dateCible: string;
  prixPredit: number;
  margeErreurFcfa: number | null;
  methode: string;
  genereLe: string;
}
