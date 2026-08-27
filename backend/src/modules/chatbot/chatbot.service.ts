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
    "Tu es SunuBot, l'assistant conversationnel intelligent de SunuPrix, une plateforme de suivi des prix au Sénégal.",
    "Réponds en français de façon naturelle, utile et concise (2-4 phrases maximum).",
    "Base-toi UNIQUEMENT sur les faits de marché ci-dessous pour les prix. Ne t'invente aucun chiffre.",
    "Si les données sont insuffisantes, propose des alternatives ou reformule la question de l'utilisateur.",
    "Sois chaleureux, précis et professionnel. N'utilise pas de préfixes comme 'Réponse:' ou 'Note:'.",
    "",
    "Données de marché disponibles :",
    contexte.resume,
    "",
    `Question de l'utilisateur : ${message}`,
  ].join("\n");
}

/** Tente un appel réel à l'API Gemini. Lève une exception si la clé est absente ou l'appel échoue. */
async function essayerGemini(message: string, contexte: ContexteChatbot): Promise<string> {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY absente.");
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
 * Génère une réponse propre et naturelle à partir des données locales,
 * sans exposer le mode de fonctionnement interne.
 */
export function genererReponseRepli(contexte: ContexteChatbot): string {
  if (contexte.faits.length === 0) {
    return "Je n'ai pas trouvé de données précises pour répondre à votre question. Essayez de mentionner un produit spécifique (riz, huile, sucre…) et/ou une région (Dakar, Thiès, Saint-Louis…).";
  }

  const fait = contexte.faits[0];
  const variation =
    fait.variationPourcent !== null
      ? fait.variationPourcent >= 0
        ? `en hausse de ${Math.abs(fait.variationPourcent).toFixed(1)}%`
        : `en baisse de ${Math.abs(fait.variationPourcent).toFixed(1)}%`
      : "sans variation connue";

  return `D'après nos dernières données, le ${fait.produit} à ${fait.region} est à **${fait.prixActuelFcfa} FCFA/${fait.unite}**, ${variation} par rapport au relevé précédent. Ces données sont fictives et générées à des fins pédagogiques.`;
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
    console.error(
      "[SunuPrix][chatbot] Gemini indisponible — clé présente:",
      !!env.geminiApiKey,
      "— erreur:",
      erreur instanceof Error ? erreur.message : String(erreur),
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
