import type { NextFunction, Request, Response } from "express";
import { NOM_COOKIE_SESSION } from "../config/constants";
import { ApiError } from "../utils/ApiError";
import { verifierToken } from "../utils/jwt";

/**
 * Middleware d'authentification réutilisable.
 *
 * Le token JWT est lu en priorité depuis le cookie httpOnly de session
 * (flux normal du frontend, cf. auth.controller.ts), avec un repli sur
 * l'en-tête `Authorization: Bearer <token>` pour faciliter les tests et
 * l'usage depuis des outils externes (Postman, scripts). En cas de token
 * absent ou invalide, la requête est rejetée avant d'atteindre le contrôleur.
 */
export function authentifier(req: Request, _res: Response, next: NextFunction): void {
  const tokenCookie = req.cookies?.[NOM_COOKIE_SESSION] as string | undefined;
  const enTeteAuth = req.headers.authorization;
  const tokenEnTete = enTeteAuth?.startsWith("Bearer ") ? enTeteAuth.slice("Bearer ".length) : undefined;
  const token = tokenCookie ?? tokenEnTete;

  if (!token) {
    next(ApiError.nonAuthentifie("Aucun token de session fourni."));
    return;
  }

  try {
    req.utilisateurCourant = verifierToken(token);
    next();
  } catch {
    next(ApiError.nonAuthentifie("Session invalide ou expirée."));
  }
}

/**
 * Variante tolérante : peuple `req.utilisateurCourant` si un token valide est
 * présent, mais ne bloque jamais la requête. Utile pour des routes publiques
 * dont la réponse peut varier légèrement selon que l'appelant est connecté.
 */
export function authentifierOptionnel(req: Request, _res: Response, next: NextFunction): void {
  const tokenCookie = req.cookies?.[NOM_COOKIE_SESSION] as string | undefined;
  const enTeteAuth = req.headers.authorization;
  const tokenEnTete = enTeteAuth?.startsWith("Bearer ") ? enTeteAuth.slice("Bearer ".length) : undefined;
  const token = tokenCookie ?? tokenEnTete;

  if (token) {
    try {
      req.utilisateurCourant = verifierToken(token);
    } catch {
      // Token invalide sur une route publique : on ignore silencieusement.
    }
  }
  next();
}
