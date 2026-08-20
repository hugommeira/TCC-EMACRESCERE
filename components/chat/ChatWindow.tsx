"use client";

import { useRef, useEffect, useState } from "react";
import { useChat }   from "@/hooks/useChat";
import { Avatar }    from "@/components/ui/Avatar";
import { Button }    from "@/components/ui/Button";
import { cn }        from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatWindowProps {
  consultationId: string;
  roomToken:      string;
  currentUserId:  string;
  currentUserName: string;
  otherUserName:  string;
}

export function ChatWindow({
  consultationId,
  roomToken,
  currentUserId,
  currentUserName,
  otherUserName,
}: ChatWindowProps) {
  const { messages, isConnected, isSending, error, sendMessage } = useChat({
    consultationId,
    roomToken,
    currentUserId,
  });

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll ao receber mensagens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    await sendMessage(content);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <ChatHeader
        otherUserName={otherUserName}
        isConnected={isConnected}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 select-none">
            <span className="text-3xl">💬</span>
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Diga olá para {otherUserName}!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender.id === currentUserId}
            showAvatar={
              i === 0 || messages[i - 1]?.sender.id !== msg.sender.id
            }
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <Avatar name={currentUserName} size="sm" />
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem… (Enter para enviar)"
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-gray-300 bg-gray-50",
                "px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400",
                "focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500",
                "transition-colors max-h-32 scrollbar-thin",
              )}
              style={{ minHeight: "42px" }}
            />
          </div>
          <Button
            onClick={() => void handleSend()}
            disabled={!draft.trim()}
            loading={isSending}
            size="sm"
            className="shrink-0 rounded-xl"
            aria-label="Enviar mensagem"
          >
            <SendIcon />
          </Button>
        </div>
        <p className="mt-1.5 pl-10 text-xs text-gray-400">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatHeader({
  otherUserName,
  isConnected,
}: {
  otherUserName: string;
  isConnected:   boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
      <Avatar name={otherUserName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{otherUserName}</p>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300",
            )}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? "Online" : "Conectando…"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
  showAvatar,
}: {
  message:    ChatMessage;
  isMine:     boolean;
  showAvatar: boolean;
}) {
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(message.createdAt));

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar placeholder to maintain alignment */}
      <div className="w-7 shrink-0">
        {!isMine && showAvatar && (
          <Avatar name={message.sender.name} size="xs" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[72%] space-y-1",
          isMine ? "items-end" : "items-start",
          "flex flex-col",
        )}
      >
        {showAvatar && !isMine && (
          <span className="pl-1 text-xs font-medium text-gray-500">
            {message.sender.name}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
            isMine
              ? "rounded-br-sm bg-brand-600 text-white"
              : "rounded-bl-sm bg-gray-100 text-gray-900",
          )}
        >
          {message.content}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 px-1",
            isMine ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-xs text-gray-400">{time}</span>
          {isMine && message.readAt && (
            <span className="text-xs text-brand-400" title="Lida">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
