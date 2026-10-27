import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Send,
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Info
} from "lucide-react";
import type { AIChatResponse } from "../types";
import { sendAssistantChat } from "../api/client";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  toolCalls?: AIChatResponse["tool_calls"];
  mapPoints?: AIChatResponse["map_focus_points"];
  itinerary?: any;
  citations?: AIChatResponse["citations"];
  timestamp: string;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: (
        "Hello! I am your **Tourism Intelligence India** assistant. I use controlled backend tools, spatial distance algorithms, and RAG knowledge retrieval to help plan your journey.\n\n" +
        "You can ask me to **plan multi-day itineraries**, **find attractions near any location**, **retrieve factual permit/timing guidelines**, or **run personalized recommendations**."
      ),
      timestamp: "Just now"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    "Plan a 4-day trip to Himachal Pradesh with mountains and trekking",
    "Tell me about Taj Mahal and what attractions are nearby",
    "Recommend relaxing coastal destinations in Goa and Kerala",
    "Do I need an Inner Line Permit for Pangong Tso and Ladakh?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (msgToSend?: string) => {
    const query = msgToSend || inputText.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await sendAssistantChat(query);
      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: res.response,
        toolCalls: res.tool_calls,
        mapPoints: res.map_focus_points,
        itinerary: res.itinerary,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: "assistant",
          text: "I encountered an issue processing your request through the backend tools. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Architecture Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-ivory tracking-tight">Agentic AI Travel Assistant</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controlled backend tool calling: `search_destinations`, `get_nearby_places`, `recommend_destinations`, `create_itinerary`.
          </p>
        </div>

        <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-teal-300 font-mono flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span>Deterministic Tool Execution</span>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium">Try asking:</span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-300 hover:text-ivory transition-colors text-left"
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 sm:p-6 min-h-[500px] max-h-[620px] overflow-y-auto space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === "user"
                  ? "bg-teal-500 text-slate-950 font-bold text-xs"
                  : "bg-slate-900 border border-slate-700 text-cyan-400"
              }`}
            >
              {m.sender === "user" ? "You" : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble & Supplements */}
            <div
              className={`space-y-3 max-w-[85%] sm:max-w-[75%] ${
                m.sender === "user"
                  ? "bg-teal-500/15 border border-teal-500/30 text-ivory p-3.5 rounded-2xl rounded-tr-none text-xs"
                  : "glass-panel-elevated p-4 rounded-2xl rounded-tl-none text-xs text-slate-200 border border-slate-800"
              }`}
            >
              {/* Tool Execution Badges (If any) */}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-slate-800 text-[11px]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-teal-400" />
                    Tools Executed on Warehouse:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.toolCalls.map((tc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-emerald-400 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {tc.tool}()
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Markdown Body */}
              <div className="whitespace-pre-line leading-relaxed text-xs">
                {m.text}
              </div>

              {/* Itinerary Structured View (If present) */}
              {m.itinerary && m.itinerary.daily_itinerary && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-500/20 space-y-3 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                    <span>{m.itinerary.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {m.itinerary.total_days} Days
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    {m.itinerary.daily_itinerary.map((d: any) => (
                      <div key={d.day} className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="font-bold text-ivory">Day {d.day}: {d.destination}</span>
                        <span className="text-slate-400 block text-[10px]">{d.focus} • Stay: {d.recommended_stay_duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Points Visualizer Links */}
              {m.mapPoints && m.mapPoints.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-teal-400" />
                    Geographical Focus:
                  </span>
                  {m.mapPoints.map((pt, idx) => (
                    <Link
                      key={idx}
                      to={`/explorer?focus=${pt.destination_id}`}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{pt.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                  <span>Source: {m.citations[0].source}</span>
                  {m.citations[0].url && (
                    <a
                      href={m.citations[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:underline flex items-center gap-0.5"
                    >
                      Link <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              )}

              <div className="text-[10px] text-slate-400 text-right">{m.timestamp}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-3.5 py-2 rounded-2xl glass-panel-elevated border border-slate-800 flex items-center gap-2 text-teal-300">
              <span className="animate-pulse">Executing tools and verifying spatial coordinates...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center glass-panel-elevated rounded-2xl p-2 border border-slate-700 focus-within:border-teal-400 shadow-2xl transition-all"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask for an itinerary, spatial nearby query, recommendations, or travel permits..."
          className="w-full bg-transparent border-none text-xs sm:text-sm text-ivory px-3 focus:outline-none placeholder:text-slate-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
