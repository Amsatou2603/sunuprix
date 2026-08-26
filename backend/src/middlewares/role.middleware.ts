import type { NextFunction, Request, Response } from "express";
import type { Role } from "../config/constants";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware de contrôle d'accès par rôle, réutilisable sur n'importe quelle
 * route protégée : `router.get("/x", authentifier, autoriserRoles("ADMIN"), ...)`.
 *
 * Centralise la vérification de rôle en un seul endroit (voir principe
 * directeur du plan d'implémentation : "pas de vérification de rôle dispersée
 * dans les contrôleurs"). Doit toujours être monté après `authentifier`.
 */
export function autoriserRoles(...rolesAutorises: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const utilisateur = req.utilisateurCourant;

    if (!utilisateur) {
      next(ApiError.nonAuthentifie());
      return;
    }

    if (!rolesAutorises.includes(utilisateur.role)) {
      next(ApiError.acceIntedit(`Cette action est réservée à : ${rolesAutorises.join(", ")}.`));
      return;
    }

    next();
  };
}
