import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as predictionsController from "./predictions.controller";

const router = Router();

// Commun à tout rôle authentifié (utilisé par la page /donnees).
router.get("/:productId/:regionId", authentifier, predictionsController.obtenirPrediction);

export default router;
