"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { chatbotApi } from "@/lib/api/chatbot";
import { ErreurApi } from "@/lib/api/api-client";

interface MessageChat {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const QUESTIONS_SUGGEREES = [
  "Quel est le prix du riz à Dakar ?",
  "Comment évolue le sucre à Thiès ?",
  "Quelle est la tendance de l'huile ce mois-ci ?",
];

function heureActuelle(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ContenuPageChatbot() {
  const [messages, setMessages] = useState<MessageChat[]>([
    {
      id: "1",
      sender: "bot",
      text: "Bonjour ! 👋 Je suis SunuBot, l'assistant IA de SunuPrix. Posez-moi une question sur le prix d'un produit dans une région du Sénégal.",
      time: heureActuelle(),
    },
  ]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const envoyerQuestion = async (questionTexte: string) => {
    if (!questionTexte.trim() || enCours) return;

    const nouveauMsgUser: MessageChat = {
      id: Date.now().toString(),
      sender: "user",
      text: questionTexte,
      time: heureActuelle(),
    };

    setMessages((prev) => [...prev, nouveauMsgUser]);
    setSaisie("");
    setEnCours(true);

    try {
      const res = await chatbotApi.envoyerMessage(questionTexte, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: res.reponse,
          time: heureActuelle(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text:
            e instanceof ErreurApi
              ? e.message
              : "SunuBot est momentanément indisponible. Réessayez dans un instant.",
          time: heureActuelle(),
        },
      ]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden w-full">
      {/* ==================== LEFT CONTROL CENTER SIDEBAR ==================== */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-lg font-extrabold text-[#0B4736]">SunuBot</h2>
            <p className="text-[11px] font-medium text-gray-400">Assistant IA SunuPrix</p>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>📊</span> Accueil
            </Link>

            {/* Active item: SunuBot */}
            <Link
              href="/chatbot"
              className="flex items-center gap-3 rounded-xl bg-[#00C49F] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <span>🤖</span> SunuBot IA
            </Link>

            <Link
              href="/donnees"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>🏷️</span> Données &amp; Prix
            </Link>
          </nav>
        </div>

        {/* Bottom items */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 px-2 pt-1">
            <Link href="/a-propos" className="hover:text-gray-900">Aide</Link>
            <Link href="/" className="hover:text-gray-900">Accueil</Link>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CHAT CONTENT ==================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/design/icon.svg" alt="SunuPrix Logo" width={32} height={32} />
              <span className="font-serif text-xl font-bold text-[#0B4736]">
                Sunu<span className="text-[#04281E]">Prix</span>
              </span>
            </Link>
          </div>
        </header>

        {/* Chat Header Subbar */}
        <div className="border-b border-gray-100 bg-[#041B13] text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5C158]/40 bg-[#F3ECE0] p-0.5 shadow">
              <Image src="/design/sunubot-icon.svg" alt="SunuBot Logo" width={36} height={36} priority />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">SunuPrix Assistant IA (SunuBot)</p>
              <p className="text-[11px] font-semibold text-[#00C49F] flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-[#00C49F] inline-block animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-[#00C49F] text-white"
                    : "border border-[#E5C158]/30 bg-[#F3ECE0]"
                }`}
              >
                {msg.sender === "user" ? (
                  "👤"
                ) : (
                  <Image src="/design/sunubot-icon.svg" alt="SunuBot" width={26} height={26} />
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-3">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#0B5D48] text-white"
                      : "border border-gray-200/80 bg-[#F5F5F7] text-gray-900 shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                <p className="text-[10px] text-gray-400 text-right">{msg.time}</p>
              </div>
            </div>
          ))}

          {enCours && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5C158]/30 bg-[#F3ECE0]">
                <Image src="/design/sunubot-icon.svg" alt="SunuBot" width={26} height={26} />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-[#F5F5F7] px-4 py-3 text-xs text-gray-500 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F] [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F] [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#00C49F]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Prompt Chips & Input Bar */}
        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
          {/* Suggestion Chips — questions que SunuBot peut réellement traiter */}
          {messages.length <= 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {QUESTIONS_SUGGEREES.map((question) => (
                <button
                  key={question}
                  onClick={() => void envoyerQuestion(question)}
                  className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void envoyerQuestion(saisie);
            }}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 focus-within:border-[#00C49F] focus-within:bg-white transition"
          >
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Posez une question sur les prix, comparez des données ou analysez des tendances..."
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={enCours}
            />
            <button
              type="submit"
              disabled={enCours || !saisie.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B5D48] text-white text-xs hover:bg-[#074737] disabled:opacity-50 transition"
            >
              ➢
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-400">
            SunuBot répond à partir des données SunuPrix (données fictives, à but pédagogique).
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PageChatbot() {
  return (
    <RouteProtegee rolesAutorises={["ADMIN", "CHERCHEUR", "VENDEUR", "MINISTERE", "CONSOMMATEUR"]}>
      <ContenuPageChatbot />
    </RouteProtegee>
  );
}
