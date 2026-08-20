"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id:       string;
  message:  string;
  variant:  ToastVariant;
}

// ─── Global store (module-level singleton) ────────────────────────────────────
let listeners: Array<(toasts: Toast[]) => void> = [];
let toastList: Toast[] = [];

function emit(next: Toast[]) {
  toastList = next;
  listeners.forEach((fn) => fn(next));
}

export const toast = {
  success: (message: string) => addToast(message, "success"),
  error:   (message: string) => addToast(message, "error"),
  info:    (message: string) => addToast(message, "info"),
  warning: (message: string) => addToast(message, "warning"),
};

function addToast(message: string, variant: ToastVariant) {
  const id   = crypto.randomUUID();
  const next = [...toastList, { id, message, variant }];
  emit(next);
  setTimeout(() => removeToast(id), 4000);
}

function removeToast(id: string) {
  emit(toastList.filter((t) => t.id !== id));
}

// ─── Toaster component (render once in layout) ────────────────────────────────
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const sync = useCallback((next: Toast[]) => setToasts([...next]), []);

  useEffect(() => {
    listeners.push(sync);
    return () => { listeners = listeners.filter((fn) => fn !== sync); };
  }, [sync]);

  const variantClasses: Record<ToastVariant, string> = {
    success: "bg-green-600  text-white",
    error:   "bg-red-600    text-white",
    info:    "bg-brand-600  text-white",
    warning: "bg-yellow-500 text-white",
  };

  const icons: Record<ToastVariant, string> = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
    warning: "⚠",
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg",
            "text-sm font-medium animate-fade-in",
            "max-w-sm min-w-64",
            variantClasses[t.variant],
          )}
        >
          <span className="shrink-0 font-bold">{icons[t.variant]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Fechar"
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
