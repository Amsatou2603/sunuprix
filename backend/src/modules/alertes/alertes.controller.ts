import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as alertsService from "./alerts.service";
import { schemaCreationAlerte, schemaMiseAJourAlerte } from "./alertes.schema";

export const listerMesAlertes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const alertes = await alertsService.listerMesAlertes(req.utilisateurCourant.sub);
  res.status(200).json({ alertes });
});

export const creerAlerte = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaCreationAlerte.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Données d'alerte invalides.", analyse.error.flatten());

  const alerte = await alertsService.creerAlerte(req.utilisateurCourant.sub, analyse.data);
  res.status(201).json({ alerte });
});

export const mettreAJourAlerte = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaMiseAJourAlerte.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Données invalides.", analyse.error.flatten());

  const alerte = await alertsService.mettreAJourAlerte(req.params.id, req.utilisateurCourant.sub, analyse.data);
  res.status(200).json({ alerte });
});

export const supprimerAlerte = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  await alertsService.supprimerAlerte(req.params.id, req.utilisateurCourant.sub);
  res.status(204).send();
});
