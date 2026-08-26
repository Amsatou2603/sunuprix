import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as authController from "./auth.controller";

const router = Router();

router.post("/inscription", authController.inscription);
router.post("/connexion", authController.connexion);
router.post("/deconnexion", authController.deconnexion);
router.get("/moi", authentifier, authController.profilCourant);
router.get("/roles", authController.rolesDisponibles);

export default router;
