import { prisma } from "../../config/prisma";

/** Seul point d'accès Prisma pour le modèle `Prediction`. */

interface DonneesPrediction {
  produitId: string;
  regionId: string;
  dateCible: Date;
  prixPredit: number;
  margeErreurFcfa: number;
  methode: string;
}

export function upsertPrediction(donnees: DonneesPrediction) {
  return prisma.prediction.upsert({
    where: {
      produitId_regionId_dateCible: {
        produitId: donnees.produitId,
        regionId: donnees.regionId,
        dateCible: donnees.dateCible,
      },
    },
    update: {
      prixPredit: donnees.prixPredit,
      margeErreurFcfa: donnees.margeErreurFcfa,
      methode: donnees.methode,
    },
    create: donnees,
  });
}

interface FiltresExport {
  produitId?: string;
  regionId?: string;
}

export function listerPourExport(filtres: FiltresExport) {
  return prisma.prediction.findMany({
    where: { produitId: filtres.produitId, regionId: filtres.regionId },
    orderBy: [{ produitId: "asc" }, { regionId: "asc" }, { dateCible: "asc" }],
    include: {
      produit: { select: { nom: true, unite: true } },
      region: { select: { nom: true } },
    },
  });
}
