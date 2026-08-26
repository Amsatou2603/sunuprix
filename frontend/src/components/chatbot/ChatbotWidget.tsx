"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthContext";
import { chatbotApi } from "@/lib/api/chatbot";
import { ErreurApi } from "@/lib/api/api-client";

interface MessageAffiche {
  role: "UTILISATEUR" | "ASSISTANT";
  contenu: string;
  source?: "GEMINI" | "REPLI_LOCAL";
}

const QUESTIONS_SUGGEREES = [
  "Quel est le prix du riz à Dakar ?",
  "Comment évolue le sucre à Thiès ?",
  "Quelle est la tendance de l'huile ce mois-ci ?",
];

/**
 * Widget de chatbot flottant, monté une seule fois dans le layout racine et
 * visible sur toutes les pages pour tout utilisateur connecté. La
 * conversation est conservée en mémoire côté client (identifiant renvoyé par
 * le backend) le temps de la session de navigation.
 */
export function ChatbotWidget() {
  const { utilisateur } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<MessageAffiche[]>([]);
  const [saisie, setSaisie] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const finDesMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ouvert, enCours]);

  if (!utilisateur) return null;

  const envoyerTexte = async (texte: string) => {
    if (!texte || enCours) return;

    setMessages((precedents) => [...precedents, { role: "UTILISATEUR", contenu: texte }]);
    setSaisie("");
    setErreur(null);
    setEnCours(true);

    try {
      const reponse = await chatbotApi.envoyerMessage(texte, conversationId);
      setConversationId(reponse.conversationId);
      setMessages((precedents) => [
        ...precedents,
        { role: "ASSISTANT", contenu: reponse.reponse, source: reponse.source },
      ]);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Le chatbot est momentanément indisponible. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  };

  const envoyer = (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    void envoyerTexte(saisie.trim());
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-5">
      {ouvert && (
        <div className="mb-3 flex h-[min(28rem,75vh)] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl2 border border-black/5 bg-white shadow-card">
          <div className="flex items-center justify-between bg-header px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base" aria-hidden="true">
                🤖
              </span>
              <div>
                <p className="text-sm font-semibold">Assistant SunuPrix</p>
                <p className="text-xs text-white/60">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" aria-hidden="true" />
                  Ancré dans les données réelles
                </p>
              </div>
            </div>
            <button onClick={() => setOuvert(false)} aria-label="Fermer le chatbot" className="text-white/70 hover:text-white">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-header/50">
                  Posez une question sur un prix, une tendance ou une région suivie par SunuPrix.
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUESTIONS_SUGGEREES.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void envoyerTexte(question)}
                      className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, indice) => (
              <div
                key={indice}
                className={clsx("flex items-end gap-2", message.role === "UTILISATEUR" && "flex-row-reverse")}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    message.role === "UTILISATEUR" ? "bg-primary/15 text-primary" : "bg-header/10 text-header",
                  )}
                  aria-hidden="true"
                >
                  {message.role === "UTILISATEUR" ? utilisateur.nom.charAt(0).toUpperCase() : "🤖"}
                </span>
                <div
                  className={clsx(
                    "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                    message.role === "UTILISATEUR" ? "bg-primary text-white" : "bg-surface text-header",
                  )}
                >
                  {message.contenu}
                  {message.source === "REPLI_LOCAL" && (
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-header/40">Mode hors-ligne</p>
                  )}
                </div>
              </div>
            ))}
            {enCours && (
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-header/10 text-xs" aria-hidden="true">
                  🤖
                </span>
                <span className="flex items-center gap-1 rounded-xl bg-surface px-3 py-2" aria-label="L'assistant réfléchit">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-header/40 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-header/40 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-header/40" />
                </span>
              </div>
            )}
            <div ref={finDesMessagesRef} />
          </div>

          {erreur && <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{erreur}</p>}

          <form onSubmit={envoyer} className="flex gap-2 border-t border-black/5 p-3">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Votre question…"
              className="champ-formulaire"
              disabled={enCours}
              aria-label="Votre message pour l'assistant"
            />
            <button type="submit" disabled={enCours || !saisie.trim()} className="bouton-primaire px-3" aria-label="Envoyer">
              ➤
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] text-header/40">
            Les réponses peuvent contenir des erreurs — données fictives à but pédagogique.
          </p>
        </div>
      )}

      <button
        onClick={() => setOuvert((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-card transition-transform hover:scale-105"
        aria-label={ouvert ? "Fermer l'assistant SunuPrix" : "Ouvrir l'assistant SunuPrix"}
      >
        {ouvert ? "✕" : "💬"}
      </button>
    </div>
  );
}
