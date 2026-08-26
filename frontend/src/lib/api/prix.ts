import { apiClient } from "./api-client";
import type { DeclarationPrixPublique, PointHistoriquePrix, SnapshotRegion } from "./types";

export interface EntreeDeclarationPrix {
  produitId: string;
  regionId: string;
  prixFcfa: number;
  dateReleve?: string;
}

export const prixApi = {
  historique: (produitId: string, regionId: string) =>
    apiClient
      .get<{ historique: PointHistoriquePrix[] }>("/api/prix/historique", { produitId, regionId })
      .then((r) => r.historique),

  carte: (produitId: string) =>
    apiClient.get<{ carte: SnapshotRegion[] }>("/api/prix/carte", { produitId }).then((r) => r.carte),

  declarer: (donnees: EntreeDeclarationPrix) =>
    apiClient.post<{ declaration: DeclarationPrixPublique }>("/api/prix/declarations", donnees).then((r) => r.declaration),

  mesDeclarations: () =>
    apiClient.get<{ declarations: DeclarationPrixPublique[] }>("/api/prix/declarations/mes").then((r) => r.declarations),
};
