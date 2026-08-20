"use client";

import { useEffect, useRef, useState } from "react";
import { useSse } from "@/lib/hooks/useSse";

interface Message {
  id:       string;
  content:  string;
  type:     "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  fileUrl:  string | null;
  createdAt: string | Date;
  sender: {
    id:        string;
    name:      string;
    role:      "PATIENT" | "DOCTOR" | "ADMIN" | "SUPER_ADMIN";
    avatarUrl: string | null;
  };
}

export function ChatPanel({
  consultationId,
  myUserId,
  disabled,
}: {
  consultationId: string;
  myUserId:       string;
  disabled?:      boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // load history
  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/consultations/${consultationId}/messages?take=100`, { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        setMessages(data.messages);
      }
    })();
  }, [consultationId]);

  // realtime
  useSse(`/api/realtime/consultation/${consultationId}`, {
    "message.new": (data) => {
      const msg = data as Message;
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
    },
  });

  // autoscroll
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    const optimisticId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        content,
        type: "TEXT",
        fileUrl: null,
        createdAt: new Date().toISOString(),
        sender: { id: myUserId, name: "Você", role: "PATIENT", avatarUrl: null },
      },
    ]);
    setInput("");
    try {
      const r = await fetch(`/api/consultations/${consultationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!r.ok) {
        // rollback optimistic
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Conversa</h3>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            Mensagens enviadas durante a consulta aparecem aqui.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === myUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-gradient-to-br from-brand-500 to-teal-500 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {!mine && (
                  <p className="text-[10px] font-semibold opacity-70">
                    {m.sender.role === "DOCTOR" ? `Dr(a). ${m.sender.name}` : m.sender.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(m.createdAt))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex-none border-t border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Consulta encerrada" : "Digite sua mensagem..."}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim() || sending}
            className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-teal-500 p-2.5 text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
