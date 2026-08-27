/**
 * Les douze produits de consommation suivis par SunuPrix — liste fermée,
 * définie une seule fois ici. Chaque produit porte une unité de référence
 * utilisée pour l'affichage des prix et la génération des données de seed.
 *
 * `prixBaseFcfa` sert de référence nationale (niveau Dakar) au script de
 * seed, qui applique ensuite un multiplicateur régional et une tendance par
 * produit (voir `backend/prisma/seed.ts`). Ces valeurs de départ ont été
 * recherchées (août 2026) à partir de statistiques publiques et de relevés
 * de prix récents plutôt qu'inventées :
 *   - ANSD, Indice Harmonisé des Prix à la Consommation (IHPC, base 2023) et
 *     notes d'analyse trimestrielles — ansd.sn.
 *   - Relevés régionaux de prix homologués/observés, janvier 2026 —
 *     prixdakar.com (riz, oignon, huile, sucre par région).
 *   - Baisse du prix du riz brisé décidée par l'État (410 → 350 FCFA/kg,
 *     ~-14,6 %) — afriksoir.net / allafrica.com, 2025.
 *   - Grille tarifaire officielle des bonbonnes de gaz butane —
 *     totalenergies.sn.
 *   - Article Le Soleil sur le prix du poisson dans le Djolof (région de
 *     Louga) — lesoleil.sn.
 * Pour les produits sans source chiffrée directe (Mil, Lait en poudre,
 * Savon), la valeur reste une estimation raisonnable documentée dans
 * `backend/prisma/seed.ts`, pas une donnée de terrain vérifiée.
 */
export interface DefinitionProduit {
  nom: string;
  unite: string;
  /** Prix de référence (FCFA, niveau national/Dakar) utilisé comme base pour le seed. */
  prixBaseFcfa: number;
}

export const PRODUITS: readonly DefinitionProduit[] = [
  { nom: "Riz", unite: "kg", prixBaseFcfa: 370 },
  { nom: "Sucre", unite: "kg", prixBaseFcfa: 650 },
  { nom: "Huile", unite: "litre", prixBaseFcfa: 1050 },
  { nom: "Oignons", unite: "kg", prixBaseFcfa: 380 },
  { nom: "Pommes de terre", unite: "kg", prixBaseFcfa: 480 },
  { nom: "Mil", unite: "kg", prixBaseFcfa: 300 },
  { nom: "Farine de blé", unite: "kg", prixBaseFcfa: 340 },
  { nom: "Poisson frais", unite: "kg", prixBaseFcfa: 1000 },
  { nom: "Tomate", unite: "kg", prixBaseFcfa: 450 },
  { nom: "Lait en poudre", unite: "kg", prixBaseFcfa: 3200 },
  { nom: "Gaz butane", unite: "bonbonne (6 kg)", prixBaseFcfa: 2900 },
  { nom: "Savon", unite: "unité", prixBaseFcfa: 500 },
] as const;

export const NOMS_PRODUITS = PRODUITS.map((p) => p.nom);

export type NomProduit = (typeof NOMS_PRODUITS)[number];
