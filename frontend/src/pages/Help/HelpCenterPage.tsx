/**
 * HelpCenterPage — AI-powered help desk for SmartHire AI.
 *
 * - Uses Groq llama-3.2-3b as the primary agent
 * - Auto-resolves: FAQs, navigation, features, how-to guides
 * - Escalates technical / site bugs → Admin
 * - Escalates process / communication issues → Recruiter
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  escalate_to?: "none" | "admin" | "recruiter";
  escalation_reason?: string | null;
  timestamp: Date;
}

interface HelpChatResponse {
  response: string;
  escalate_to: "none" | "admin" | "recruiter";
  escalation_reason?: string | null;
}

// ---------------------------------------------------------------------------
// Suggested starter questions
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  "How do I upload my resume?",
  "How does the ATS score work?",
  "My video interview isn't recording — what do I do?",
  "How can a recruiter review my results?",
  "Why is my login not working?",
  "How do I improve my interview score?",
];

// ---------------------------------------------------------------------------
// Escalation card
// ---------------------------------------------------------------------------

function EscalationCard({
  to,
  reason,
}: {
  to: "admin" | "recruiter";
  reason?: string | null;
}) {
  const isAdmin = to === "admin";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-3 rounded-2xl border p-4 flex items-start gap-3 ${
        isAdmin
          ? "bg-red-500/8 border-red-500/25"
          : "bg-amber-500/8 border-amber-500/25"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isAdmin ? "bg-red-500/15" : "bg-amber-500/15"
        }`}
      >
        <span
          className={`material-symbols-outlined text-lg ${
            isAdmin ? "text-red-400" : "text-amber-400"
          }`}
        >
          {isAdmin ? "admin_panel_settings" : "badge"}
        </span>
      </div>
      <div className="flex-1">
        <p
          className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${
            isAdmin ? "text-red-400" : "text-amber-400"
          }`}
        >
          Escalated to {isAdmin ? "Platform Admin" : "Recruiter Team"}
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          {reason ||
            (isAdmin
              ? "This looks like a platform or technical issue. Our admin team has been notified and will follow up shortly."
              : "This involves the hiring process or direct communication. A recruiter will be in touch to assist you.")}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Single chat message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow ${
          isUser
            ? "bg-[#5b5cf6] text-white"
            : "bg-emerald-500/15 border border-emerald-500/25"
        }`}
      >
        {isUser ? (
          <span className="material-symbols-outlined text-sm">person</span>
        ) : (
          <span className="material-symbols-outlined text-sm text-emerald-400">smart_toy</span>
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-[#5b5cf6] text-white rounded-br-sm"
              : "bg-slate-800/80 border border-white/[0.06] text-slate-200 rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>

        {/* Escalation card below assistant response */}
        {!isUser && msg.escalate_to && msg.escalate_to !== "none" && (
          <EscalationCard to={msg.escalate_to} reason={msg.escalation_reason} />
        )}

        <span className="text-[10px] text-slate-600 mt-1 px-1 font-mono">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2.5"
    >
      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-sm text-emerald-400">smart_toy</span>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/80 border border-white/[0.06] flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function HelpCenterPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm AIRA Help, your SmartHire AI support assistant.\n\nI can help you with account issues, interview tips, ATS scoring, resume uploads, and general platform questions.\n\nWhat can I help you with today?",
      escalate_to: "none",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasEscalated, setHasEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build history for context (exclude welcome)
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const { data } = await apiClient.post<HelpChatResponse>("/help/chat", {
        message: trimmed,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.response,
        escalate_to: data.escalate_to,
        escalation_reason: data.escalation_reason,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.escalate_to !== "none") {
        setHasEscalated(true);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment, or contact support directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "👋 Hi! I'm AIRA Help, your SmartHire AI support assistant.\n\nI can help you with account issues, interview tips, ATS scoring, resume uploads, and general platform questions.\n\nWhat can I help you with today?",
        escalate_to: "none",
        timestamp: new Date(),
      },
    ]);
    setHasEscalated(false);
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-[#dae2fd] flex flex-col">

      {/* ── Top Header ── */}
      <div className="border-b border-white/[0.06] bg-[#0b1220]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-xl">support_agent</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">AIRA Help Center</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-mono">
                AI Agent · Groq llama-3.2-3b-preview · Online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/[0.06]"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            New Chat
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full flex-col">

        {/* Info banner */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#5b5cf6]/8 border border-[#5b5cf6]/20 text-xs text-slate-300">
            <span className="material-symbols-outlined text-[#5b5cf6] text-base shrink-0 mt-0.5">info</span>
            <span>
              Our AI agent resolves most queries instantly. If your issue needs human attention, it will automatically route to the
              {" "}<strong className="text-white">Platform Admin</strong> (technical/site issues) or
              {" "}<strong className="text-white">Recruiter Team</strong> (process/communication).
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>

          {isLoading && (
            <AnimatePresence>
              <TypingIndicator />
            </AnimatePresence>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested questions (only at start) */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-6 pb-3">
            <p className="text-[11px] text-slate-500 mb-2 font-mono uppercase tracking-wider">
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800/60 border border-white/[0.07] rounded-lg hover:border-[#5b5cf6]/40 hover:text-white hover:bg-[#5b5cf6]/10 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Escalation summary banner */}
        {hasEscalated && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
              <span className="material-symbols-outlined text-sm text-amber-400">notification_important</span>
              Your issue has been escalated. A team member will follow up shortly. You can continue chatting.
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-end gap-3 bg-slate-900/60 border border-white/[0.08] rounded-2xl p-3 focus-within:border-[#5b5cf6]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your issue or ask a question…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
              style={{ minHeight: "24px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                input.trim() && !isLoading
                  ? "bg-[#5b5cf6] hover:bg-[#4f50e2] text-white shadow-lg shadow-[#5b5cf6]/25 scale-100"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed scale-95"
              }`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-base">send</span>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center font-mono">
            Press Enter to send · Shift+Enter for new line · Powered by Groq llama-3.2-3b
          </p>
        </div>
      </div>
    </div>
  );
}
