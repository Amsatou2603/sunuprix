import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { construireContexte } from "./chatbot.context";
import * as chatbotRepository from "./chatbot.repository";
import type { ContexteChatbot, MessageConversation, ReponseChatbot } from "./chatbot.types";

/**
 * Construit le prompt envoyé à Gemini : consignes de rôle + contexte factuel
 * réel (jamais de connaissances générales du modèle sur des prix qu'il n'a
 * pas) + message de l'utilisateur. Le modèle est explicitement invité à
 * rester dans les faits fournis et à rappeler le caractère pédagogique des
 * données.
 */
function construirePrompt(message: string, contexte: ContexteChatbot): string {
  return [
    "Tu es l'assistant conversationnel de SunuPrix, une plateforme pédagogique de suivi des prix au Sénégal.",
    "Réponds en français, de façon concise (3 phrases maximum), en te basant UNIQUEMENT sur les faits ci-dessous.",
    "Si les faits ne permettent pas de répondre précisément, dis-le clairement plutôt que d'inventer un chiffre.",
    "Rappelle si pertinent que les données sont fictives, à but pédagogique.",
    "",
    "Faits disponibles :",
    contexte.resume,
    "",
    `Question de l'utilisateur : ${message}`,
  ].join("\n");
}

/** Tente un appel réel à l'API Gemini. Lève une exception si la clé est absente ou l'appel échoue. */
async function essayerGemini(message: string, contexte: ContexteChatbot): Promise<string> {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY absente : bascule sur le mode de repli local.");
  }

  const client = new GoogleGenerativeAI(env.geminiApiKey);
  const modele = client.getGenerativeModel({ model: env.geminiModel });

  const resultat = await modele.generateContent(construirePrompt(message, contexte));
  const texte = resultat.response.text()?.trim();

  if (!texte) {
    throw new Error("Réponse Gemini vide.");
  }
  return texte;
}

/**
 * Mode de repli local : construit une réponse en langage naturel directement
 * à partir du même contexte factuel que celui envoyé à Gemini. Utilisé
 * chaque fois que la clé API est absente ou que l'appel échoue (quota,
 * réseau, erreur du service) — la démonstration ne dépend donc jamais de la
 * disponibilité d'un service externe.
 */
export function genererReponseRepli(contexte: ContexteChatbot): string {
  if (contexte.faits.length === 0) {
    return "Je n'ai pas trouvé de données correspondant précisément à votre question. Essayez par exemple : « Quel est le prix du riz à Dakar ? » ou « Comment évolue le sucre à Thiès ? ».";
  }

  return `${contexte.resume} Ces données sont fictives et générées à des fins pédagogiques.`;
}


export async function genererReponseAvecRepli(
  message: string,
  contexte: ContexteChatbot,
): Promise<{ texte: string; source: ReponseChatbot["source"] }> {
  try {
    const texte = await essayerGemini(message, contexte);
    return { texte, source: "GEMINI" };
  } catch (erreur) {
    // eslint-disable-next-line no-console
    console.warn(
      "[SunuPrix][chatbot] Appel Gemini indisponible, bascule sur le mode de repli local :",
      erreur instanceof Error ? erreur.message : erreur,
    );
    return { texte: genererReponseRepli(contexte), source: "REPLI_LOCAL" };
  }
}

function horodatageMaintenant(): string {
  return new Date().toISOString();
}

export async function envoyerMessage(
  utilisateurId: string,
  message: string,
  conversationId?: string,
): Promise<ReponseChatbot> {
  const contexte = await construireContexte(message);
  const { texte, source } = await genererReponseAvecRepli(message, contexte);

  const messageUtilisateur: MessageConversation = {
    role: "UTILISATEUR",
    contenu: message,
    horodatage: horodatageMaintenant(),
  };
  const messageAssistant: MessageConversation = {
    role: "ASSISTANT",
    contenu: texte,
    horodatage: horodatageMaintenant(),
  };

  if (conversationId) {
    const conversation = await chatbotRepository.trouverConversation(conversationId, utilisateurId);
    if (!conversation) {
      throw ApiError.introuvable("Conversation introuvable.");
    }
    const messagesExistants = Array.isArray(conversation.messages)
      ? (conversation.messages as unknown as MessageConversation[])
      : [];
    const misAJour = await chatbotRepository.ajouterMessages(conversationId, [
      ...messagesExistants,
      messageUtilisateur,
      messageAssistant,
    ]);
    return { conversationId: misAJour.id, reponse: texte, source };
  }

  const nouvelleConversation = await chatbotRepository.creerConversation(utilisateurId, [
    messageUtilisateur,
    messageAssistant,
  ]);
  return { conversationId: nouvelleConversation.id, reponse: texte, source };
}
