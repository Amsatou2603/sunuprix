import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as adminController from "./admin.controller";

const router = Router();

// Toutes les routes de ce module sont réservées à ADMIN.
router.use(authentifier, autoriserRoles("ADMIN"));

router.get("/utilisateurs", adminController.listerUtilisateurs);
router.patch("/utilisateurs/:id/role", adminController.changerRoleUtilisateur);
router.patch("/utilisateurs/:id/statut", adminController.changerStatutUtilisateur);

router.get("/declarations-prix", adminController.listerDeclarationsEnAttente);
router.patch("/declarations-prix/:id/valider", adminController.validerDeclaration);
router.patch("/declarations-prix/:id/rejeter", adminController.rejeterDeclaration);

router.get("/seuils", adminController.obtenirSeuils);
router.put("/seuils", adminController.mettreAJourSeuils);

export default router;
