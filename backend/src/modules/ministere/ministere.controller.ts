import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as annoncesService from "./annonces.service";
import * as inflationService from "./inflation.service";
import { schemaPublicationAnnonce } from "./annonces.schema";

export const publierAnnonce = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaPublicationAnnonce.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Annonce invalide.", analyse.error.flatten());

  const annonce = await annoncesService.publierAnnonce(req.utilisateurCourant.sub, analyse.data);
  res.status(201).json({ annonce });
});

export const listerAnnonces = asyncHandler(async (_req: Request, res: Response) => {
  const annonces = await annoncesService.listerAnnonces();
  res.status(200).json({ annonces });
});

export const obtenirInflation = asyncHandler(async (_req: Request, res: Response) => {
  const inflation = await inflationService.calculerInflationParRegion();
  res.status(200).json({ inflation });
});
