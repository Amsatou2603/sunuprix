import { z } from "zod";

export const schemaMessageChatbot = z.object({
  message: z.string().trim().min(1, "Le message ne peut pas être vide.").max(1000),
  conversationId: z.string().min(1).optional(),
});

export type EntreeMessageChatbot = z.infer<typeof schemaMessageChatbot>;
