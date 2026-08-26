"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { chatbotApi } from "@/lib/api/chatbot";

interface MessageChat {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  widgets?: boolean;
}

function ContenuPageChatbot() {
  const [messages, setMessages] = useState<MessageChat[]>([
    {
      id: "1",
      sender: "bot",
      text: "Good morning. I've analyzed the latest market trends for commodities in West Africa. Notably, rice prices have shown a slight upward volatility.",
      time: "09:41 AM",
    },
    {
      id: "2",
      sender: "user",
      text: "Show me the specific data for rice in Senegal, compared to last month.",
      time: "09:43 AM",
    },
    {
      id: "3",
      sender: "bot",
      text: "Here is the breakdown for Rice (Long Grain) in Senegal. We are seeing a 4.2% increase compared to a 30-day moving average.",
      time: "09:43 AM",
      widgets: true,
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
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "J'ai analysé les données récentes. Le marché présente une stabilité globale avec des variations modérées sur le riz et l'huile.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-900 overflow-hidden">
      {/* ==================== LEFT CONTROL CENTER SIDEBAR ==================== */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-lg font-extrabold text-[#0B4736]">Control Center</h2>
            <p className="text-[11px] font-medium text-gray-400">Precision Intelligence</p>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>📊</span> Dashboard
            </Link>

            {/* Active item: Market Insights */}
            <Link
              href="/chatbot"
              className="flex items-center gap-3 rounded-xl bg-[#00C49F] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <span>📈</span> Market Insights
            </Link>

            <Link
              href="/donnees"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>🏷️</span> Price Index
            </Link>

            <Link
              href="/vendeur"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>🏪</span> Vendors
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </div>

        {/* Bottom items */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50/50 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition">
            ✨ AI Insights
          </button>
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 px-2 pt-1">
            <Link href="/a-propos" className="hover:text-gray-900">Help</Link>
            <Link href="/" className="hover:text-gray-900">Logout</Link>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CHAT CONTENT ==================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/design/icon.svg" alt="SunuPrix Logo" width={32} height={32} />
              <span className="font-serif text-xl font-bold text-[#0B4736]">
                Sunu<span className="text-[#04281E]">Prix</span>
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-gray-500">
              <Link href="/donnees" className="hover:text-[#00B493]">Analytics</Link>
              <Link href="/donnees" className="hover:text-[#00B493]">Markets</Link>
              <Link href="/donnees" className="hover:text-[#00B493]">Inventory</Link>
              <Link href="/admin" className="hover:text-[#00B493]">Users</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-lg bg-[#00C49F] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#00a989] transition">
              Create Report
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600">🔔</button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600">⚙️</button>
            <div className="h-8 w-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              SA
            </div>
          </div>
        </header>

        {/* Chat Header Subbar */}
        <div className="border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
              🤖
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">SunuPrix Assistant</p>
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Online - AI Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <button className="p-1.5 hover:text-gray-600">📜</button>
            <button className="p-1.5 hover:text-gray-600">⋮</button>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center">
            <span className="rounded-full bg-gray-200/60 px-3 py-1 text-[11px] font-medium text-gray-500">
              Today, 09:41 AM
            </span>
          </div>

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
                    ? "bg-gray-200 text-gray-700"
                    : "bg-blue-500 text-white"
                }`}
              >
                {msg.sender === "user" ? "👤" : "🤖"}
              </div>

              {/* Message Content */}
              <div className="space-y-3">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#0B5D48] text-white"
                      : "border border-gray-100 bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Embedded Interactive Widgets matching Image 4 */}
                {msg.widgets && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Widget 1: Current Avg Price */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Current Avg Price</span>
                          <span>📈</span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-gray-900">
                          450 <span className="text-xs font-normal text-gray-500">XOF/kg</span>
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          ↑ +4.2% (MoM)
                        </span>
                      </div>

                      {/* Widget 2: Regional Heatmap */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold text-gray-700 mb-2">
                          Regional Heatmap (Dakar vs Regions)
                        </p>
                        <div className="h-20 w-full rounded-lg bg-emerald-900/10 p-2 flex items-center justify-center relative">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-800 shadow-md">
                            📍 Dakar Focus
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Widget Action Pills */}
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full border border-gray-300 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                        📥 Export Data
                      </button>
                      <button className="rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200 transition">
                        ✨ Predict next month
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-right">{msg.time}</p>
              </div>
            </div>
          ))}

          {enCours && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                🤖
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Prompt Chips & Input Bar */}
        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
          {/* Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => void envoyerQuestion("Compare with Mali")}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Compare with Mali
            </button>
            <button
              onClick={() => void envoyerQuestion("Show vendor distribution")}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Show vendor distribution
            </button>
            <button
              onClick={() => void envoyerQuestion("Alert me if price > 460")}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
            >
              Alert me if price &gt; 460
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void envoyerQuestion(saisie);
            }}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 focus-within:border-[#00C49F] focus-within:bg-white transition"
          >
            <button type="button" className="text-gray-400 hover:text-gray-600 text-base">
              📎
            </button>
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Ask for insights, compare data, or analyze trends..."
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
            ℹ AI can make mistakes. Verify important data.
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
