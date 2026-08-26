import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import * as chatbotController from "./chatbot.controller";

const router = Router();

// Accessible depuis toutes les pages, pour tout rôle authentifié.
router.post("/", authentifier, chatbotController.envoyerMessage);

export default router;
