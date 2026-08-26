import type { Request, Response } from "express";
import { estProduction } from "../../config/env";
import { NOM_COOKIE_SESSION, ROLES_INSCRIPTIBLES, LIBELLES_ROLES } from "../../config/constants";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as authService from "./auth.service";
import { schemaConnexion, schemaInscription } from "./auth.schema";

/**
 * Durée de vie du cookie de session, dérivée de JWT_EXPIRES_IN pour rester
 * cohérente avec la durée de validité du token lui-même (7 jours par défaut).
 */
const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

function poserCookieSession(res: Response, token: string): void {
  res.cookie(NOM_COOKIE_SESSION, token, {
    httpOnly: true,
    secure: estProduction,
    // "none" est nécessaire pour un cookie cross-site (frontend Vercel /
    // backend Render) ; en local (http, même origine logique) "lax" suffit.
    sameSite: estProduction ? "none" : "lax",
    maxAge: SEPT_JOURS_MS,
    path: "/",
  });
}

export const inscription = asyncHandler(async (req: Request, res: Response) => {
  const analyse = schemaInscription.safeParse(req.body);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Données d'inscription invalides.", analyse.error.flatten());
  }

  const { utilisateur, token } = await authService.inscrire(analyse.data);
  poserCookieSession(res, token);
  res.status(201).json({ utilisateur });
});

export const connexion = asyncHandler(async (req: Request, res: Response) => {
  const analyse = schemaConnexion.safeParse(req.body);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Données de connexion invalides.", analyse.error.flatten());
  }

  const { utilisateur, token } = await authService.connecter(analyse.data);
  poserCookieSession(res, token);
  res.status(200).json({ utilisateur });
});

export const deconnexion = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(NOM_COOKIE_SESSION, { path: "/" });
  res.status(200).json({ message: "Déconnecté avec succès." });
});

export const profilCourant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) {
    throw ApiError.nonAuthentifie();
  }
  const utilisateur = await authService.obtenirProfilCourant(req.utilisateurCourant.sub);
  res.status(200).json({ utilisateur });
});

// Exposé pour le formulaire d'inscription du frontend : la liste des rôles
// choisissables ne doit jamais être recopiée côté client.
export const rolesDisponibles = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    roles: ROLES_INSCRIPTIBLES.map((role) => ({ valeur: role, libelle: LIBELLES_ROLES[role] })),
  });
});
