import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as alertsService from "./alerts.service";

export const listerMesNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const notifications = await alertsService.listerMesNotifications(req.utilisateurCourant.sub);
  res.status(200).json({ notifications });
});

export const compterNonLues = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const compte = await alertsService.compterNotificationsNonLues(req.utilisateurCourant.sub);
  res.status(200).json({ compte });
});

export const marquerLue = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();
  const notification = await alertsService.marquerNotificationLue(req.params.id, req.utilisateurCourant.sub);
  res.status(200).json({ notification });
});
