"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ConfirmTone = "danger" | "warning" | "primary";

interface ConfirmOptions {
  title:         string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  tone?:         ConfirmTone;
}

type Resolver = (ok: boolean) => void;

interface OpenState extends ConfirmOptions {
  open:     boolean;
  resolve?: Resolver;
}

const DEFAULT: OpenState = { open: false, title: "", message: "" };

// ─── Singleton store (intra-page) ─────────────────────────────────────────────
//
// `confirmDialog(...)` retorna uma Promise que resolve com true/false quando
// o usuário clica. O <ConfirmDialogHost /> precisa estar montado em algum lugar
// da árvore (uso: 1 instância no root layout ou shell).

const mountSubscribers: Set<(s: OpenState) => void> = new Set();
let currentState: OpenState = DEFAULT;

function notify() {
  mountSubscribers.forEach((fn) => fn(currentState));
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    currentState = {
      open: true,
      title:        opts.title,
      message:      opts.message,
      ...(opts.confirmLabel ? { confirmLabel: opts.confirmLabel } : {}),
      ...(opts.cancelLabel  ? { cancelLabel:  opts.cancelLabel  } : {}),
      ...(opts.tone         ? { tone: opts.tone }                : {}),
      resolve,
    };
    notify();
  });
}

// ─── Host (montar no root layout) ─────────────────────────────────────────────

export function ConfirmDialogHost() {
  const [state, setState] = useState<OpenState>(currentState);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const sub = (s: OpenState) => setState(s);
    mountSubscribers.add(sub);
    return () => { mountSubscribers.delete(sub); };
  }, []);

  const close = useCallback((ok: boolean) => {
    state.resolve?.(ok);
    currentState = DEFAULT;
    setState(DEFAULT);
  }, [state]);

  // ESC fecha
  useEffect(() => {
    if (!state.open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter")  close(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state.open, close]);

  if (!mounted || !state.open) return null;

  const tone = state.tone ?? "primary";
  const confirmClass =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-300"
      : tone === "warning"
        ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-300"
        : "bg-gradient-to-r from-brand-500 to-teal-500 hover:shadow-lg focus:ring-brand-300";

  const iconBgClass =
    tone === "danger"
      ? "bg-rose-50  text-rose-600  ring-rose-100"
      : tone === "warning"
        ? "bg-amber-50 text-amber-600 ring-amber-100"
        : "bg-brand-50 text-brand-600 ring-brand-100";

  const node = (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) close(false); }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-start gap-4">
          <span className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-full ring-4 ring-inset ${iconBgClass}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {tone === "danger" ? (
                <>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </>
              ) : tone === "warning" ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-title" className="font-display text-lg font-semibold text-slate-900">
              {state.title}
            </h3>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {state.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => close(false)}
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {state.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-4 ${confirmClass}`}
          >
            {state.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
