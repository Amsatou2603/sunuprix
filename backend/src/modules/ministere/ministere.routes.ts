import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as ministereController from "./ministere.controller";

const router = Router();

// Annonces : publication réservée au Ministère, lecture ouverte à tout rôle
// authentifié (affichées sur l'accueil de tous les profils).
router.get("/annonces", authentifier, ministereController.listerAnnonces);
router.post("/annonces", authentifier, autoriserRoles("MINISTERE"), ministereController.publierAnnonce);

// Vue macro d'inflation : réservée au Ministère.
router.get("/inflation", authentifier, autoriserRoles("MINISTERE"), ministereController.obtenirInflation);

export default router;
