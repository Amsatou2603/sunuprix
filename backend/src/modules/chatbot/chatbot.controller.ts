import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as chatbotService from "./chatbot.service";
import { schemaMessageChatbot } from "./chatbot.schema";

export const envoyerMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.utilisateurCourant) throw ApiError.nonAuthentifie();

  const analyse = schemaMessageChatbot.safeParse(req.body);
  if (!analyse.success) {
    throw ApiError.mauvaiseRequete("Message invalide.", analyse.error.flatten());
  }

  const resultat = await chatbotService.envoyerMessage(
    req.utilisateurCourant.sub,
    analyse.data.message,
    analyse.data.conversationId,
  );
  res.status(200).json(resultat);
});
