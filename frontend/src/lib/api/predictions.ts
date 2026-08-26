import { apiClient } from "./api-client";
import type { PredictionPublique } from "./types";

export const predictionsApi = {
  obtenir: (produitId: string, regionId: string) =>
    apiClient.get<{ prediction: PredictionPublique }>(`/api/predictions/${produitId}/${regionId}`).then((r) => r.prediction),
};
