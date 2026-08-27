import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as analyseService from "./analyse.service";
import { schemaDiagnostic } from "./analyse.schema";

export const diagnostiquer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();

  const analyse = schemaDiagnostic.safeParse(req.body);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Données de comparaison invalides.", analyse.error.flatten());
  }

  const resultat = await analyseService.genererDiagnostic(analyse.data);
  res.status(200).json({ diagnostic: resultat.texte, source: resultat.source });
});
