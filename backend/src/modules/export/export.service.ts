import * as prixRepository from "../prix/prix.repository";
import * as predictionsRepository from "../predictions/predictions.repository";
import { versCsv } from "../../utils/csv";

interface LigneExport {
  type: "RELEVE" | "PREDICTION";
  produit: string;
  unite: string;
  region: string;
  date: string;
  prix_fcfa: number;
  marge_erreur_fcfa: number | "";
  methode_ou_source: string;
}

interface FiltresExport {
  produitId?: string;
  regionId?: string;
}

/**
 * Génère l'export CSV réservé aux chercheurs : relevés de prix validés et
 * prédictions, réunis dans un seul fichier (colonne `Type` pour les
 * distinguer) et triés par produit / région / date pour rester facilement
 * exploitables dans un tableur.
 */
export async function genererCsvExport(filtres: FiltresExport): Promise<string> {
  const [releves, predictions] = await Promise.all([
    prixRepository.listerPourExport(filtres),
    predictionsRepository.listerPourExport(filtres),
  ]);

  const lignes: LigneExport[] = [
    ...releves.map(
      (releve): LigneExport => ({
        type: "RELEVE",
        produit: releve.produit.nom,
        unite: releve.produit.unite,
        region: releve.region.nom,
        date: releve.dateReleve.toISOString().slice(0, 10),
        prix_fcfa: releve.prixFcfa,
        marge_erreur_fcfa: "",
        methode_ou_source: releve.source,
      }),
    ),
    ...predictions.map(
      (prediction): LigneExport => ({
        type: "PREDICTION",
        produit: prediction.produit.nom,
        unite: prediction.produit.unite,
        region: prediction.region.nom,
        date: prediction.dateCible.toISOString().slice(0, 10),
        prix_fcfa: prediction.prixPredit,
        marge_erreur_fcfa: prediction.margeErreurFcfa ?? "",
        methode_ou_source: prediction.methode,
      }),
    ),
  ].sort(
    (a, b) => a.produit.localeCompare(b.produit) || a.region.localeCompare(b.region) || a.date.localeCompare(b.date),
  );

  return versCsv(lignes, [
    { cle: "type", entete: "Type" },
    { cle: "produit", entete: "Produit" },
    { cle: "unite", entete: "Unité" },
    { cle: "region", entete: "Région" },
    { cle: "date", entete: "Date" },
    { cle: "prix_fcfa", entete: "Prix (FCFA)" },
    { cle: "marge_erreur_fcfa", entete: "Marge d'erreur (FCFA)" },
    { cle: "methode_ou_source", entete: "Méthode / Source" },
  ]);
}
