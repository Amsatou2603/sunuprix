import { apiClient } from "./api-client";
import type { Produit, Region } from "./types";

/**
 * Accès aux listes fermées régions/produits telles que peuplées en base.
 * Point d'entrée unique pour tout composant ayant besoin de ces listes — ne
 * jamais recopier les noms de région/produit en dur dans un composant.
 */
export const referentielApi = {
  regions: () => apiClient.get<{ regions: Region[] }>("/api/regions").then((r) => r.regions),
  produits: () => apiClient.get<{ produits: Produit[] }>("/api/produits").then((r) => r.produits),
};
