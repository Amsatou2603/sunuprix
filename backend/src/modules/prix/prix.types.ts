/** Un point de la série historique de prix, tel que renvoyé au frontend. */
export interface PointHistoriquePrix {
  date: string;
  prixFcfa: number;
  source: "SYSTEME" | "CONTRIBUTEUR";
}

/** Snapshot d'une région pour un produit donné (carte + cartes de synthèse). */
export interface SnapshotRegion {
  regionId: string;
  region: string;
  prixActuelFcfa: number | null;
  variationMensuellePourcent: number | null;
  dateDernierReleve: string | null;
}

/** Déclaration de prix vue par un contributeur ou un modérateur. */
export interface DeclarationPrixPublique {
  id: string;
  produit: { id: string; nom: string; unite: string };
  region: { id: string; nom: string };
  prixFcfa: number;
  statut: "VALIDE" | "EN_ATTENTE" | "REJETE";
  dateReleve: string;
  creeLe: string;
  modereLe: string | null;
  contributeur?: { id: string; nom: string; email: string } | null;
}
