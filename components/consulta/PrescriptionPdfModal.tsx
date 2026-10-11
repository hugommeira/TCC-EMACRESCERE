"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetchBlob, mensagemDeErro } from "@/lib/api-client";
import { Alert } from "@/components/ui/Alert";

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
  // O PDF é conferido antes de ir para o iframe: se der erro, aparece uma
  // mensagem (antes o JSON de erro aparecia cru dentro do visualizador). O
  // iframe usa a mesma URL de antes (a CSP não libera iframe de blob:).
  const [pronto, setPronto] = useState(false);
  const [erro,   setErro]   = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setPronto(false);
    setErro(null);
    apiFetchBlob(`/api/prescriptions/${prescriptionId}/pdf`)
      .then(() => { if (!cancelado) setPronto(true); })
      .catch((err) => { if (!cancelado) setErro(mensagemDeErro(err)); });
    return () => { cancelado = true; };
  }, [open, prescriptionId, tentativa]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function download() {
    setDownloading(true);
    try {
      const blob = await apiFetchBlob(`/api/prescriptions/${prescriptionId}/pdf?download=1`);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `receita-${prescriptionId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErro(mensagemDeErro(err));
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
          {erro ? (
            <div className="flex h-full items-center justify-center p-6">
              <Alert variant="error" title="Não foi possível abrir a receita" className="max-w-md">
                <p>{erro}</p>
                <button
                  type="button"
                  onClick={() => setTentativa((t) => t + 1)}
                  className="mt-2 text-sm font-semibold underline"
                >
                  Tentar de novo
                </button>
              </Alert>
            </div>
          ) : pronto ? (
            <iframe
              src={inlineUrl}
              title="Receita médica"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Carregando a receita...
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
