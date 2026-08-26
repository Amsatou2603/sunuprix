import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../config/prisma";

/**
 * Vérifie que l'API répond et, dans la mesure du possible, que la base de
 * données est joignable — utile pour les sondes de santé de Render.
 */
export const verifierSante = asyncHandler(async (_req: Request, res: Response) => {
  let baseDeDonnees: "ok" | "indisponible" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    baseDeDonnees = "indisponible";
  }

  res.status(200).json({
    statut: "ok",
    baseDeDonnees,
    horodatage: new Date().toISOString(),
  });
});
