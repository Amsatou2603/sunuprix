import { apiClient } from "./api-client";
import type { ConfigurationSeuils, DeclarationPrixPublique, UtilisateurPublic } from "./types";

export const adminApi = {
  utilisateurs: () => apiClient.get<{ utilisateurs: UtilisateurPublic[] }>("/api/admin/utilisateurs").then((r) => r.utilisateurs),
  changerRole: (id: string, role: string) =>
    apiClient.patch<{ utilisateur: UtilisateurPublic }>(`/api/admin/utilisateurs/${id}/role`, { role }).then((r) => r.utilisateur),
  changerStatut: (id: string, actif: boolean) =>
    apiClient
      .patch<{ utilisateur: UtilisateurPublic }>(`/api/admin/utilisateurs/${id}/statut`, { actif })
      .then((r) => r.utilisateur),

  declarationsEnAttente: () =>
    apiClient.get<{ declarations: DeclarationPrixPublique[] }>("/api/admin/declarations-prix").then((r) => r.declarations),
  validerDeclaration: (id: string) =>
    apiClient
      .patch<{ declaration: DeclarationPrixPublique }>(`/api/admin/declarations-prix/${id}/valider`)
      .then((r) => r.declaration),
  rejeterDeclaration: (id: string) =>
    apiClient
      .patch<{ declaration: DeclarationPrixPublique }>(`/api/admin/declarations-prix/${id}/rejeter`)
      .then((r) => r.declaration),

  obtenirSeuils: () => apiClient.get<{ configuration: ConfigurationSeuils }>("/api/admin/seuils").then((r) => r.configuration),
  mettreAJourSeuils: (donnees: { seuilAttentionPourcent: number; seuilCritiquePourcent: number }) =>
    apiClient.put<{ configuration: ConfigurationSeuils }>("/api/admin/seuils", donnees).then((r) => r.configuration),
};
