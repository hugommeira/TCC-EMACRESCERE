"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open:           boolean;
  onClose:        () => void;
  prescriptionId: string;
  title?:         string;
  subtitle?:      string;
}

export function PrescriptionPdfModal({
  open, onClose, prescriptionId, title, subtitle,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}/pdf?download=1`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as { message?: string }));
        alert(j.message ?? "Falha ao baixar a receita");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `receita-${prescriptionId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (!mounted || !open) return null;

  // URL do iframe (inline)
  const inlineUrl = `/api/prescriptions/${prescriptionId}/pdf`;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/65 px-2 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex flex-none items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold text-slate-900 sm:text-lg">
              {title ?? "Receita médica"}
            </h2>
            {subtitle && (
              <p className="truncate text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={() => void download()}
              disabled={downloading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
                  </svg>
                  Baixando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  <span className="hidden sm:inline">Baixar PDF</span>
                  <span className="sm:hidden">Baixar</span>
                </>
              )}
            </button>
            <a
              href={inlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              title="Abrir em nova aba"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 3h7v7M21 3l-9 9M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
              </svg>
              <span className="hidden sm:inline">Nova aba</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          <iframe
            src={inlineUrl}
            title="Receita médica"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
