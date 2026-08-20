"use client";

import { useEffect, useRef, useState } from "react";
import { useSse } from "@/lib/hooks/useSse";

interface Attachment {
  id:          string;
  kind:        "RECEITA" | "LAUDO" | "EXAME" | "OUTRO";
  fileName:    string;
  mimeType:    string;
  size:        number;
  description: string | null;
  createdAt:   string | Date;
  downloadUrl: string;
}

const KIND_LABEL: Record<Attachment["kind"], string> = {
  RECEITA: "Receita",
  LAUDO:   "Laudo",
  EXAME:   "Exame",
  OUTRO:   "Outro",
};

const KIND_COLOR: Record<Attachment["kind"], string> = {
  RECEITA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LAUDO:   "bg-indigo-50 text-indigo-700 ring-indigo-200",
  EXAME:   "bg-amber-50 text-amber-700 ring-amber-200",
  OUTRO:   "bg-slate-100 text-slate-700 ring-slate-200",
};

export function AttachmentsPanel({
  consultationId,
  isDoctor,
  canUpload,
}: {
  consultationId: string;
  isDoctor:       boolean;
  canUpload:      boolean;
}) {
  const [items, setItems]         = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [kind, setKind]           = useState<Attachment["kind"]>(isDoctor ? "RECEITA" : "OUTRO");
  const inputRef                  = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch(`/api/consultations/${consultationId}/attachments`, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      setItems(data.attachments);
    }
  }

  useEffect(() => { void load(); }, [consultationId]);

  useSse(`/api/realtime/consultation/${consultationId}`, {
    "attachment.new": () => { void load(); },
  });

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      // Upload via servidor (FormData) — sem CORS
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);

      const res = await fetch(`/api/consultations/${consultationId}/attachments/upload`, {
        method: "POST",
        body:   fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as { message?: string }));
        setError(j.message ?? `Falha no upload (HTTP ${res.status})`);
        return;
      }

      await load();
    } catch (err) {
      console.error("[upload] error:", err);
      setError("Erro de conexão durante upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Anexos</h3>
      </div>

      {canUpload && (
        <div className="flex-none border-b border-slate-200 p-3">
          <div className="flex flex-wrap gap-1.5">
            {(["RECEITA","LAUDO","EXAME","OUTRO"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                  kind === k
                    ? `${KIND_COLOR[k]} ring-current`
                    : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="10" className="opacity-25" />
                  <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Anexar arquivo
              </>
            )}
          </button>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Máx. 50 MB · PDF, imagens, etc.
          </p>
          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-700">{error}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            Nenhum anexo ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex flex-none rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${KIND_COLOR[a.kind]}`}>
                    {KIND_LABEL[a.kind]}
                  </span>
                  <a
                    href={a.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none rounded-md p-1 text-slate-400 hover:text-brand-600"
                    aria-label="Baixar"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </a>
                </div>
                <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
                  {a.fileName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {(a.size / 1024).toFixed(0)} KB ·{" "}
                  {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(a.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
