/**
 * Les douze produits de consommation suivis par SunuPrix — liste fermée,
 * définie une seule fois ici. Chaque produit porte une unité de référence
 * utilisée pour l'affichage des prix et la génération des données de seed.
 */
export interface DefinitionProduit {
  nom: string;
  unite: string;
  /** Prix de départ approximatif (FCFA) utilisé comme base réaliste pour le seed. */
  prixBaseFcfa: number;
}

export const PRODUITS: readonly DefinitionProduit[] = [
  { nom: "Riz", unite: "kg", prixBaseFcfa: 450 },
  { nom: "Sucre", unite: "kg", prixBaseFcfa: 650 },
  { nom: "Huile", unite: "litre", prixBaseFcfa: 1100 },
  { nom: "Oignons", unite: "kg", prixBaseFcfa: 350 },
  { nom: "Pommes de terre", unite: "kg", prixBaseFcfa: 400 },
  { nom: "Mil", unite: "kg", prixBaseFcfa: 300 },
  { nom: "Farine de blé", unite: "kg", prixBaseFcfa: 380 },
  { nom: "Poisson frais", unite: "kg", prixBaseFcfa: 1500 },
  { nom: "Tomate", unite: "kg", prixBaseFcfa: 425 },
  { nom: "Lait en poudre", unite: "kg", prixBaseFcfa: 3200 },
  { nom: "Gaz butane", unite: "bonbonne", prixBaseFcfa: 3800 },
  { nom: "Savon", unite: "unité", prixBaseFcfa: 500 },
] as const;

export const NOMS_PRODUITS = PRODUITS.map((p) => p.nom);

export type NomProduit = (typeof NOMS_PRODUITS)[number];
