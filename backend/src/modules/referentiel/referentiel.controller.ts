import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as referentielRepository from "./referentiel.repository";

/**
 * Endpoints de lecture seule exposant les listes fermées régions/produits
 * telles que peuplées en base — utilisés par le frontend pour construire les
 * sélecteurs de /donnees, le formulaire vendeur, les filtres chercheur, etc.
 * Jamais de valeur recopiée en dur côté frontend : tout vient d'ici.
 */

export const listerRegions = asyncHandler(async (_req: Request, res: Response) => {
  const regions = await referentielRepository.listerRegions();
  res.status(200).json({ regions });
});

export const listerProduits = asyncHandler(async (_req: Request, res: Response) => {
  const produits = await referentielRepository.listerProduits();
  res.status(200).json({ produits });
});
