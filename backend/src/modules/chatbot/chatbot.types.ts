/** Un fait de marché isolé par le contexte du chatbot, pour un couple produit/région reconnu dans le message. */
export interface FaitMarche {
  produit: string;
  unite: string;
  region: string;
  prixActuelFcfa: number;
  variationPourcent: number | null;
  dateDernierReleve: string;
}

/** Contexte factuel construit à partir de la base avant tout appel (Gemini ou repli). */
export interface ContexteChatbot {
  produitMentionne: string | null;
  regionMentionnee: string | null;
  faits: FaitMarche[];
  /** Résumé en langage naturel des faits ci-dessus, réutilisé tel quel par le mode de repli. */
  resume: string;
}

export interface MessageConversation {
  role: "UTILISATEUR" | "ASSISTANT";
  contenu: string;
  horodatage: string;
}

export interface ReponseChatbot {
  conversationId: string;
  reponse: string;
  source: "GEMINI" | "REPLI_LOCAL";
}
