import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as referentielController from "./referentiel.controller";

const router = Router();

// Accessibles à tout utilisateur authentifié, quel que soit son rôle : ce
// sont des données de référence, pas des données sensibles.
router.get("/regions", authentifier, referentielController.listerRegions);
router.get("/produits", authentifier, referentielController.listerProduits);

export default router;
