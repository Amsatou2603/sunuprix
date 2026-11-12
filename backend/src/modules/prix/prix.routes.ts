import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as prixController from "./prix.controller";

const router = Router();

// Consultation publique (pages /donnees et /donnees/details) : accessible sans
// compte. Ces routes ne renvoient que des relevés VALIDÉS, sans aucune donnée
// personnelle (ni contributeur, ni modérateur).
router.get("/historique", prixController.obtenirHistorique);
router.get("/carte", prixController.obtenirCarte);

// Réservé aux contributeurs.
router.post("/declarations", authentifier, autoriserRoles("CONTRIBUTEUR"), prixController.declarerPrix);
router.get("/declarations/mes", authentifier, autoriserRoles("CONTRIBUTEUR"), prixController.listerMesDeclarations);

export default router;
