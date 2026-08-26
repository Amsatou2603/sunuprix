import type { NextFunction, Request, Response } from "express";

type GestionnaireAsync = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Enrobe un gestionnaire de route asynchrone pour transmettre automatiquement
 * toute exception rejetée à `next(err)`, sans avoir à répéter un bloc
 * try/catch dans chaque contrôleur.
 */
export function asyncHandler(gestionnaire: GestionnaireAsync) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(gestionnaire(req, res, next)).catch(next);
  };
}
