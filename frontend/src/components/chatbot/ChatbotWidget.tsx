"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
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
      setErreur(
        e instanceof ErreurApi
          ? e.message
          : "SunuBot est momentanément indisponible. Réessayez dans un instant."
      );
    } finally {
      setEnCours(false);
    }
  };

  const envoyer = (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    void envoyerTexte(saisie.trim());
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-6">
      {ouvert && (
        <div className="mb-4 flex h-[min(32rem,80vh)] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-[#00C49F]/20 bg-[#062118] text-white shadow-2xl backdrop-blur-xl">
          {/* Header matching attached photo */}
          <div className="flex items-center justify-between border-b border-[#0D4033] bg-[#041B13] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5C158]/40 bg-[#F3ECE0] p-0.5 shadow">
                <Image src="/design/sunubot-icon.svg" alt="SunuBot Logo" width={36} height={36} priority />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">SunuPrix Assistant IA</p>
                <p className="text-xs font-semibold text-[#00C49F] flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#00C49F] animate-pulse" />
                  En ligne
                </p>
              </div>
            </div>

            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer SunuBot"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#08281E] hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Scroll View matching attached photo */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Initial Welcome Message from Photo */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5C158]/30 bg-[#F3ECE0]">
                <Image src="/design/sunubot-icon.svg" alt="SunuBot" width={26} height={26} />
              </div>
              <div className="max-w-[85%] rounded-2xl bg-[#0F382C] px-4 py-3 text-xs leading-relaxed text-emerald-50 shadow-sm border border-emerald-500/10">
                <p className="font-medium">
                  Bonjour ! 👋<br />
                  Comment puis-je vous aider aujourd&apos;hui concernant les prix, les marchés ou l&apos;inflation ?
                </p>
              </div>
            </div>

            {/* User & Bot conversation messages */}
            {messages.map((message, indice) => (
              <div
                key={indice}
                className={`flex items-start gap-3 ${
                  message.role === "UTILISATEUR" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    message.role === "UTILISATEUR"
                      ? "bg-[#00C49F] text-white"
                      : "border border-[#E5C158]/30 bg-[#F3ECE0]"
                  }`}
                >
                  {message.role === "UTILISATEUR" ? (
                    utilisateur.nom.charAt(0).toUpperCase()
                  ) : (
                    <Image src="/design/sunubot-icon.svg" alt="SunuBot" width={26} height={26} />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    message.role === "UTILISATEUR"
                      ? "bg-[#00C49F] text-white font-medium shadow-md"
                      : "bg-[#0F382C] text-emerald-50 border border-emerald-500/10 shadow-sm"
                  }`}
                >
                  <p>{message.contenu}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator (3 Dots) matching photo */}
            {enCours && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5C158]/30 bg-[#F3ECE0]">
                  <Image src="/design/sunubot-icon.svg" alt="SunuBot" width={26} height={26} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#0F382C] px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F] [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F] [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F]" />
                </div>
              </div>
            )}

            <div ref={finDesMessagesRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mb-2">
                Questions suggérées
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUESTIONS_SUGGEREES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void envoyerTexte(q)}
                    className="rounded-full border border-[#00C49F]/30 bg-[#08281E] px-3 py-1 text-left text-[11px] font-medium text-emerald-200 hover:bg-[#0D4033] hover:text-white transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {erreur && (
            <p className="border-t border-red-900/50 bg-red-950/60 px-4 py-2 text-xs text-red-300">
              {erreur}
            </p>
          )}

          {/* Input Bar */}
          <form onSubmit={envoyer} className="flex gap-2 border-t border-[#0D4033] bg-[#041B13] p-3">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Posez votre question à SunuBot…"
              className="w-full rounded-xl border border-[#0D4033] bg-[#08281E] px-4 py-2.5 text-xs text-white placeholder-emerald-100/40 focus:border-[#00C49F] focus:outline-none"
              disabled={enCours}
            />
            <button
              type="submit"
              disabled={enCours || !saisie.trim()}
              className="flex items-center justify-center rounded-xl bg-[#00C49F] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00a989] disabled:opacity-50"
            >
              ➢
            </button>
          </form>

          <p className="pb-2 text-center text-[10px] text-emerald-100/40">
            SunuBot IA ancré dans les données officielles du Sénégal.
          </p>
        </div>
      )}

      {/* Floating Trigger Button with SunuBot Logo */}
      <button
        onClick={() => setOuvert((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E5C158] bg-[#062118] p-1.5 shadow-2xl transition-transform hover:scale-110"
        aria-label={ouvert ? "Fermer SunuBot" : "Ouvrir l'assistant SunuBot"}
      >
        <Image src="/design/sunubot-icon.svg" alt="SunuBot Floating Launcher" width={44} height={44} priority />
      </button>
    </div>
  );
}

