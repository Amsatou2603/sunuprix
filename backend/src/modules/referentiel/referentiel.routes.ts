import { Router } from "express";
import * as referentielController from "./referentiel.controller";

const router = Router();

// Publiques : ce sont des données de référence (liste des régions et des
// produits suivis), nécessaires à la consultation des prix sans compte.
router.get("/regions", referentielController.listerRegions);
router.get("/produits", referentielController.listerProduits);

export default router;
