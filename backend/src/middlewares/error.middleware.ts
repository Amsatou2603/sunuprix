import type { NextFunction, Request, Response } from "express";
import { estProduction } from "../config/env";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware d'erreurs global (4 arguments requis par Express pour être
 * reconnu comme tel). Toute erreur remontée via `next(err)` ou via
 * `asyncHandler` finit ici et produit une réponse JSON uniforme.
 */
export function gestionnaireErreurs(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      erreur: err.message,
      details: err.details,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[SunuPrix] Erreur non gérée :", err);

  res.status(500).json({
    erreur: "Erreur interne du serveur.",
    details: estProduction ? undefined : String(err),
  });
}

/** Middleware 404 pour toute route inconnue de l'API. */
export function routeInconnue(req: Request, res: Response): void {
  res.status(404).json({ erreur: `Route inconnue : ${req.method} ${req.originalUrl}` });
}
