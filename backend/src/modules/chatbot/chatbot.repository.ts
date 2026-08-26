import { prisma } from "../../config/prisma";
import type { MessageConversation } from "./chatbot.types";

/** Seul point d'accès Prisma pour `ConversationChatbot`. */

export function trouverConversation(id: string, utilisateurId: string) {
  return prisma.conversationChatbot.findFirst({ where: { id, utilisateurId } });
}

export function creerConversation(utilisateurId: string, messages: MessageConversation[]) {
  return prisma.conversationChatbot.create({
    data: { utilisateurId, messages: messages as unknown as object },
  });
}

export function ajouterMessages(id: string, messages: MessageConversation[]) {
  return prisma.conversationChatbot.update({
    where: { id },
    data: { messages: messages as unknown as object },
  });
}
