import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as notificationsController from "./notifications.controller";

const router = Router();

router.get("/", authentifier, notificationsController.listerMesNotifications);
router.get("/non-lues/compte", authentifier, notificationsController.compterNonLues);
router.patch("/:id/lue", authentifier, notificationsController.marquerLue);

export default router;
