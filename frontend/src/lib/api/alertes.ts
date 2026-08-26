import { apiClient } from "./api-client";
import type { Alerte, NotificationUtilisateur } from "./types";

export interface EntreeCreationAlerte {
  produitId: string;
  regionId: string;
  seuilPourcent?: number;
}

export interface EntreeMiseAJourAlerte {
  active?: boolean;
  seuilPourcent?: number;
}

export const alertesApi = {
  lister: () => apiClient.get<{ alertes: Alerte[] }>("/api/alertes").then((r) => r.alertes),
  creer: (donnees: EntreeCreationAlerte) =>
    apiClient.post<{ alerte: Alerte }>("/api/alertes", donnees).then((r) => r.alerte),
  mettreAJour: (id: string, donnees: EntreeMiseAJourAlerte) =>
    apiClient.patch<{ alerte: Alerte }>(`/api/alertes/${id}`, donnees).then((r) => r.alerte),
  supprimer: (id: string) => apiClient.delete<void>(`/api/alertes/${id}`),
};

export const notificationsApi = {
  lister: () =>
    apiClient.get<{ notifications: NotificationUtilisateur[] }>("/api/notifications").then((r) => r.notifications),
  compterNonLues: () => apiClient.get<{ compte: number }>("/api/notifications/non-lues/compte").then((r) => r.compte),
  marquerLue: (id: string) =>
    apiClient.patch<{ notification: NotificationUtilisateur }>(`/api/notifications/${id}/lue`).then((r) => r.notification),
};
