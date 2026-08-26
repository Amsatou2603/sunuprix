import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as predictionsService from "./predictions.service";

export const obtenirPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { productId, regionId } = req.params;
  if (!productId || !regionId) {
    throw ApiError.mauvaiseRequete("productId et regionId sont requis.");
  }
  const prediction = await predictionsService.calculerEtPersisterPrediction(productId, regionId);
  res.status(200).json({ prediction });
});
