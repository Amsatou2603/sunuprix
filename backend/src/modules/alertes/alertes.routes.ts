import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as alertesController from "./alertes.controller";

const router = Router();

// Gestion des alertes personnelles : ouverte à tout rôle authentifié (le
// plan la présente côté Consommateur, mais rien n'empêche un autre rôle de
// suivre un produit/région qui l'intéresse).
router.get("/", authentifier, alertesController.listerMesAlertes);
router.post("/", authentifier, alertesController.creerAlerte);
router.patch("/:id", authentifier, alertesController.mettreAJourAlerte);
router.delete("/:id", authentifier, alertesController.supprimerAlerte);

export default router;
