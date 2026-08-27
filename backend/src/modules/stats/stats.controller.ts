import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as statsRepository from "./stats.repository";

export const obtenirStatsPubliques = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await statsRepository.compterStatsPubliques();
  res.status(200).json({ stats });
});
