import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as prixController from "./prix.controller";

const router = Router();

// Lecture commune (page /donnees) : tout rôle authentifié.
router.get("/historique", authentifier, prixController.obtenirHistorique);
router.get("/carte", authentifier, prixController.obtenirCarte);

// Réservé aux vendeurs.
router.post("/declarations", authentifier, autoriserRoles("VENDEUR"), prixController.declarerPrix);
router.get("/declarations/mes", authentifier, autoriserRoles("VENDEUR"), prixController.listerMesDeclarations);

export default router;
