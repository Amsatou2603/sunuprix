import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as authService from "../auth/auth.service";
import * as prixService from "../prix/prix.service";
import * as alertsService from "../alertes/alerts.service";
import { schemaChangementRole, schemaChangementStatut } from "./admin.schema";
import { schemaConfigurationSeuils } from "../alertes/alertes.schema";

// ---------------------------------------------------------------------------
// Gestion des utilisateurs
// ---------------------------------------------------------------------------

export const listerUtilisateurs = asyncHandler(async (_req: Request, res: Response) => {
  const utilisateurs = await authService.listerUtilisateurs();
  res.status(200).json({ utilisateurs });
});

export const changerRoleUtilisateur = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaChangementRole.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Rôle invalide.", analyse.error.flatten());

  const utilisateur = await authService.changerRole(req.params.id, analyse.data.role, req.utilisateurCourant.sub);
  res.status(200).json({ utilisateur });
});

export const changerStatutUtilisateur = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaChangementStatut.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Statut invalide.", analyse.error.flatten());

  const utilisateur = await authService.changerStatutActif(req.params.id, analyse.data.actif, req.utilisateurCourant.sub);
  res.status(200).json({ utilisateur });
});

// ---------------------------------------------------------------------------
// Modération des déclarations de prix vendeur
// ---------------------------------------------------------------------------

export const listerDeclarationsEnAttente = asyncHandler(async (_req: Request, res: Response) => {
  const declarations = await prixService.listerEnAttenteModeration();
  res.status(200).json({ declarations });
});

export const validerDeclaration = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const declaration = await prixService.validerDeclaration(req.params.id, req.utilisateurCourant.sub);
  res.status(200).json({ declaration });
});

export const rejeterDeclaration = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const declaration = await prixService.rejeterDeclaration(req.params.id, req.utilisateurCourant.sub);
  res.status(200).json({ declaration });
});

// ---------------------------------------------------------------------------
// Seuils par défaut du système d'alerte
// ---------------------------------------------------------------------------

export const obtenirSeuils = asyncHandler(async (_req: Request, res: Response) => {
  const configuration = await alertsService.obtenirConfigurationSeuils();
  res.status(200).json({ configuration });
});

export const mettreAJourSeuils = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const analyse = schemaConfigurationSeuils.safeParse(req.body);
  if (!analyse.success) throw ApiError.mauvaiseRequete("Seuils invalides.", analyse.error.flatten());

  const configuration = await alertsService.mettreAJourConfigurationSeuils(req.utilisateurCourant.sub, analyse.data);
  res.status(200).json({ configuration });
});
