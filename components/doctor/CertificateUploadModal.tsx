"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open:       boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  title?:     string;
  reason?:    string;
}

export function CertificateUploadModal({ open, onClose, onSuccess, title, reason }: Props) {
  const [file,      setFile]      = useState<File | null>(null);
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const [mounted,  setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPassword("");
      setError(null);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file)     { setError("Selecione o arquivo .pfx ou .p12"); return; }
    if (!password) { setError("Digite a senha do certificado"); return; }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("password", password);
      const r = await fetch("/api/doctor/certificate", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) {
        setError(data.message ?? "Não foi possível validar o certificado");
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setError("Erro de conexão");
    } finally {
      setUploading(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !uploading) onClose(); }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-brand-100/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {title ?? "Carregar certificado A1"}
              </h2>
              {reason && (
                <p className="mt-0.5 text-xs text-slate-500">{reason}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Arquivo .pfx ou .p12
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pfx,.p12,application/x-pkcs12"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
              className="mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            {file && (
              <p className="mt-1.5 text-[11px] text-slate-500">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Senha do certificado
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="off"
                autoFocus
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  {showPwd ? (
                    <>
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M1 1l22 22" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/60 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200">
            <strong>Segurança:</strong> a senha é encriptada com AES-256 antes de ser armazenada. O arquivo .pfx fica em storage privado e só é carregado para assinar suas receitas.
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !password}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
                  </svg>
                  Validando...
                </>
              ) : (
                "Salvar certificado"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
