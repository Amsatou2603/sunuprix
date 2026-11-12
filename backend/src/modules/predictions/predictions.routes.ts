import { Router } from "express";
import * as predictionsController from "./predictions.controller";

const router = Router();

// Consultation publique (pages /donnees et /donnees/details) : la prédiction
// est calculée uniquement à partir des relevés validés, sans donnée personnelle.
router.get("/:productId/:regionId", predictionsController.obtenirPrediction);

export default router;
