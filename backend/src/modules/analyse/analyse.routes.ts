import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as analyseController from "./analyse.controller";

const router = Router();

// Diagnostic IA d'une comparaison (page Chercheur) : tout rôle authentifié.
router.post("/diagnostic", authentifier, analyseController.diagnostiquer);

export default router;
