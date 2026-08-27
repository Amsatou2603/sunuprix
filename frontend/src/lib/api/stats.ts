import { apiClient } from "./api-client";

export interface StatsPubliques {
  produits: number;
  regions: number;
  relevesPrix: number;
}

export const statsApi = {
  publiques: () => apiClient.get<{ stats: StatsPubliques }>("/api/stats/public").then((r) => r.stats),
};
