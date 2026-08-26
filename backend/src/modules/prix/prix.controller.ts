import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as prixService from "./prix.service";
import { schemaDeclarationPrix, schemaRequeteCarte, schemaRequeteHistorique } from "./prix.schema";

export const obtenirHistorique = asyncHandler(async (req: Request, res: Response) => {
  const analyse = schemaRequeteHistorique.safeParse(req.query);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Paramètres invalides.", analyse.error.flatten());
  }
  const historique = await prixService.obtenirHistorique(analyse.data.produitId, analyse.data.regionId);
  res.status(200).json({ historique });
});

export const obtenirCarte = asyncHandler(async (req: Request, res: Response) => {
  const analyse = schemaRequeteCarte.safeParse(req.query);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Paramètres invalides.", analyse.error.flatten());
  }
  const carte = await prixService.obtenirCarteParProduit(analyse.data.produitId);
  res.status(200).json({ carte });
});

export const declarerPrix = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();

  const analyse = schemaDeclarationPrix.safeParse(req.body);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Données de déclaration invalides.", analyse.error.flatten());
  }

  const declaration = await prixService.declarerPrix(req.utilisateurCourant.sub, {
    produitId: analyse.data.produitId,
    regionId: analyse.data.regionId,
    prixFcfa: analyse.data.prixFcfa,
    dateReleve: analyse.data.dateReleve ?? new Date(),
  });
  res.status(201).json({ declaration });
});

export const listerMesDeclarations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const declarations = await prixService.listerMesDeclarations(req.utilisateurCourant.sub);
  res.status(200).json({ declarations });
});
