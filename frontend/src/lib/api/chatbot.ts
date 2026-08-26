import { apiClient } from "./api-client";
import type { ReponseChatbot } from "./types";

export const chatbotApi = {
  envoyerMessage: (message: string, conversationId?: string) =>
    apiClient.post<ReponseChatbot>("/api/chatbot", { message, conversationId }),
};
