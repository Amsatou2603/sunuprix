import { apiClient } from "./api-client";

export interface EntreeDiagnosticEntite {
  label: string;
  historique: { date: string; prixFcfa: number }[];
  prediction: { prixPredit: number; margeErreurFcfa: number | null } | null;
}

export interface EntreeDiagnostic {
  mode: "REGIONS" | "PRODUITS";
  axeFixeLabel: string;
  entites: EntreeDiagnosticEntite[];
}

export interface ReponseDiagnostic {
  diagnostic: string;
  source: "GEMINI" | "REPLI_LOCAL";
}

export const analyseApi = {
  diagnostiquer: (donnees: EntreeDiagnostic) =>
    apiClient.post<ReponseDiagnostic>("/api/analyse/diagnostic", donnees),
};
