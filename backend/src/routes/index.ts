import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import healthRoutes from "../modules/health/health.routes";
import referentielRoutes from "../modules/referentiel/referentiel.routes";
import prixRoutes from "../modules/prix/prix.routes";
import predictionsRoutes from "../modules/predictions/predictions.routes";
import chatbotRoutes from "../modules/chatbot/chatbot.routes";
import alertesRoutes from "../modules/alertes/alertes.routes";
import notificationsRoutes from "../modules/alertes/notifications.routes";
import adminRoutes from "../modules/admin/admin.routes";
import ministereRoutes from "../modules/ministere/ministere.routes";
import exportRoutes from "../modules/export/export.routes";

/**
 * Point d'entrée unique de montage des routes de l'API. Chaque module définit
 * ses propres chemins (voir son fichier `*.routes.ts`) ; ce fichier ne fait
 * que les rattacher sous le préfixe `/api` commun (posé dans app.ts).
 */
const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Référentiel (régions/produits) : chemins définis dans le module lui-même.
router.use(referentielRoutes);
router.use("/prix", prixRoutes);
router.use("/predictions", predictionsRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/alertes", alertesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/admin", adminRoutes);
// Ministère : chemins /annonces et /inflation définis dans le module lui-même.
router.use(ministereRoutes);
router.use("/export", exportRoutes);

export default router;
