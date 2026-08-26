import { apiClient } from "./api-client";

export interface FiltresExport {
  produitId?: string;
  regionId?: string;
  [cle: string]: string | number | boolean | undefined;
}

/**
 * Déclenche le téléchargement du CSV réservé aux chercheurs. Le nom du
 * fichier est repris de l'en-tête `Content-Disposition` renvoyé par le
 * backend lorsque disponible, sinon un nom de repli daté est utilisé.
 */
export async function telechargerExportCsv(filtres: FiltresExport = {}): Promise<void> {
  const blob = await apiClient.getBlob("/api/export/csv", filtres);
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `sunuprix-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}
