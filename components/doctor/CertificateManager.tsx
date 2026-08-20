"use client";

import { useEffect, useRef, useState } from "react";
import { confirmDialog } from "@/components/ui/ConfirmDialog";

interface CertInfo {
  id:           string;
  fileName:     string;
  subjectCN:    string | null;
  issuerCN:     string | null;
  serialNumber: string | null;
  validFrom:    string | Date | null;
  validTo:      string | Date | null;
  active:       boolean;
  createdAt:    string | Date;
}

const PT_BR = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

export function CertificateManager() {
  const [cert,     setCert]     = useState<CertInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [showPwd,  setShowPwd]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/doctor/certificate", { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        setCert(data.certificate);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file)    { setError("Selecione o arquivo .pfx"); return; }
    if (!password){ setError("Digite a senha do certificado"); return; }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("password", password);
      const r = await fetch("/api/doctor/certificate", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) {
        setError(data.message ?? "Falha ao salvar certificado");
        return;
      }
      setCert(data.certificate);
      setPassword("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Erro de conexão");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const ok = await confirmDialog({
      title:        "Remover certificado A1?",
      message:      "Você não poderá emitir receitas até carregar um novo certificado digital.",
      confirmLabel: "Remover certificado",
      tone:         "danger",
    });
    if (!ok) return;
    const r = await fetch("/api/doctor/certificate", { method: "DELETE" });
    if (r.ok) setCert(null);
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="space-y-6">
      {cert && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Certificado A1 ativo
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                {cert.subjectCN ?? cert.fileName}
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                <Info label="Emissor (AC)"    value={cert.issuerCN ?? "—"} />
                <Info label="Número de série" value={cert.serialNumber ?? "—"} />
                <Info label="Válido a partir de" value={cert.validFrom ? PT_BR.format(new Date(cert.validFrom)) : "—"} />
                <Info
                  label="Válido até"
                  value={cert.validTo ? PT_BR.format(new Date(cert.validTo)) : "—"}
                  warning={cert.validTo ? new Date(cert.validTo) < new Date() : false}
                />
              </dl>
            </div>
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Remover
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {cert ? "Substituir certificado" : "Carregar certificado A1 (ICP-Brasil)"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Arquivo <strong>.pfx</strong> ou <strong>.p12</strong> emitido por Autoridade Certificadora credenciada (Serasa, Certisign, Soluti, etc).
            A senha é armazenada com criptografia AES-256 e nunca aparece em logs.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Arquivo do certificado
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pfx,.p12,application/x-pkcs12"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
            Senha do .pfx
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-700"
              aria-label={showPwd ? "Esconder" : "Mostrar"}
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

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !password}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Spinner />
              Validando e salvando...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              {cert ? "Substituir certificado" : "Salvar certificado"}
            </>
          )}
        </button>

        <div className="rounded-xl bg-amber-50/60 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
          <strong>Segurança:</strong> seu arquivo .pfx fica armazenado encriptado no servidor.
          A senha é criptografada com AES-256-GCM antes de ser persistida.
          Em produção real, use sempre o seu próprio certificado ICP-Brasil pessoal — a Emaerescere
          nunca terá acesso à sua chave privada em texto claro.
        </div>
      </form>
    </div>
  );
}

function Info({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`text-slate-800 ${warning ? "text-rose-600 font-semibold" : ""}`}>{value}{warning && " (expirado)"}</dd>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
    </svg>
  );
}
