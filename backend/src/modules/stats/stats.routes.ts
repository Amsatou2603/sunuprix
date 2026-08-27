import { Router } from "express";
import * as statsController from "./stats.controller";

const router = Router();

// Volontairement public (pas de middleware `authentifier`) : ce sont des
// comptages agrégés non sensibles, affichés sur la page d'accueil même pour
// un visiteur non connecté.
router.get("/public", statsController.obtenirStatsPubliques);

export default router;
