import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as prixController from "./prix.controller";

const router = Router();

// Lecture commune (page /donnees) : tout rôle authentifié.
router.get("/historique", authentifier, prixController.obtenirHistorique);
router.get("/carte", authentifier, prixController.obtenirCarte);

// Réservé aux contributeurs.
router.post("/declarations", authentifier, autoriserRoles("CONTRIBUTEUR"), prixController.declarerPrix);
router.get("/declarations/mes", authentifier, autoriserRoles("CONTRIBUTEUR"), prixController.listerMesDeclarations);

export default router;
