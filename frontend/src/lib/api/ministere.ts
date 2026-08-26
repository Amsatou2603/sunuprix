import { apiClient } from "./api-client";
import type { Annonce, InflationRegion } from "./types";

export interface EntreePublicationAnnonce {
  titre: string;
  contenu: string;
}

export const ministereApi = {
  annonces: () => apiClient.get<{ annonces: Annonce[] }>("/api/annonces").then((r) => r.annonces),
  publierAnnonce: (donnees: EntreePublicationAnnonce) =>
    apiClient.post<{ annonce: Annonce }>("/api/annonces", donnees).then((r) => r.annonce),
  inflation: () => apiClient.get<{ inflation: InflationRegion[] }>("/api/inflation").then((r) => r.inflation),
};
