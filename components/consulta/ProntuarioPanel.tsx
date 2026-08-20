"use client";

import { useEffect, useRef, useState } from "react";
import { useSse } from "@/lib/hooks/useSse";

interface Prontuario {
  chiefComplaint: string | null;
  diagnosis:      string | null;
  conduct:        string | null;
  notes:          string | null;
}

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function ProntuarioPanel({
  consultationId,
  initial,
  initialUpdatedAt,
  isDoctor,
  patientName,
  patientAge,
  patientGender,
  patientBloodType,
  patientMedications,
  allergies,
  doctorName,
}: {
  consultationId:     string;
  initial:            Prontuario;
  initialUpdatedAt:   string | Date | null;
  isDoctor:           boolean;
  patientName:        string;
  patientAge:         string | null;
  patientGender:      string | null;
  patientBloodType:   string | null;
  patientMedications: string[];
  allergies:          string[];
  doctorName?:        string | null;
}) {
  const [data,     setData]     = useState<Prontuario>(initial);
  const [status,   setStatus]   = useState<SaveStatus>("idle");
  const [savedAt,  setSavedAt]  = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [updatedBy, setUpdatedBy] = useState<string | null>(doctorName ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ref pro estado inicial — evita salvar no primeiro render
  const isFirstRender = useRef(true);
  // "tick" pra forçar re-render do tempo relativo
  const [, setTick]   = useState(0);

  // Atualiza tempo relativo a cada 30s
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  // Push em tempo real (paciente vê updates do médico; médico vê próprio update via outro tab)
  useSse(`/api/realtime/consultation/${consultationId}`, {
    "prontuario.updated": (payload) => {
      const p = payload as Prontuario & { updatedAt?: string; updatedBy?: string | null };
      setData({
        chiefComplaint: p.chiefComplaint,
        diagnosis:      p.diagnosis,
        conduct:        p.conduct,
        notes:          p.notes,
      });
      if (p.updatedAt) setSavedAt(new Date(p.updatedAt));
      if (p.updatedBy !== undefined) setUpdatedBy(p.updatedBy);
      setStatus("saved");
    },
  });

  // Auto-save com debounce (somente médico, somente após primeira edição)
  useEffect(() => {
    if (!isDoctor) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("dirty");
    const t = setTimeout(async () => {
      setStatus("saving");
      setErrorMsg(null);
      try {
        const r = await fetch(`/api/consultations/${consultationId}/prontuario`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as { message?: string }));
          setErrorMsg(j.message ?? "Falha ao salvar");
          setStatus("error");
          return;
        }
        const json = await r.json();
        if (json.updatedAt) setSavedAt(new Date(json.updatedAt));
        setStatus("saved");
      } catch {
        setErrorMsg("Erro de conexão");
        setStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.chiefComplaint, data.diagnosis, data.conduct, data.notes]);

  function field<K extends keyof Prontuario>(key: K) {
    return {
      value:    data[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setData((d) => ({ ...d, [key]: e.target.value })),
    };
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-slate-200 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Prontuário</h3>
          <SaveBadge
            status={status}
            savedAt={savedAt}
            error={errorMsg}
            isDoctor={isDoctor}
            updatedBy={updatedBy}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-xl bg-brand-50/50 p-3 ring-1 ring-brand-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Paciente</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{patientName}</p>

          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <InfoRow label="Idade"  value={patientAge} />
            <InfoRow label="Sexo"   value={patientGender ? translateGender(patientGender) : null} />
            <InfoRow label="Tipo sanguíneo" value={patientBloodType} />
          </dl>

          {patientMedications.length > 0 && (
            <div className="mt-2.5 rounded-lg bg-white/70 px-2 py-1.5 ring-1 ring-brand-100/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Medicações em uso</p>
              <p className="mt-0.5 text-[11px] text-slate-700">
                {patientMedications.join(", ")}
              </p>
            </div>
          )}

          {allergies.length > 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900 ring-1 ring-amber-200">
              ⚠ Alergias: {allergies.join(", ")}
            </p>
          )}
        </div>

        <Section
          label="Queixa principal"
          isDoctor={isDoctor}
          value={data.chiefComplaint ?? ""}
          field={field("chiefComplaint")}
        />
        <Section
          label="Diagnóstico"
          isDoctor={isDoctor}
          value={data.diagnosis ?? ""}
          field={field("diagnosis")}
        />
        <Section
          label="Conduta clínica"
          isDoctor={isDoctor}
          value={data.conduct ?? ""}
          field={field("conduct")}
          rows={5}
        />
        <Section
          label="Notas internas"
          isDoctor={isDoctor}
          value={data.notes ?? ""}
          field={field("notes")}
          internalOnly
        />
      </div>
    </div>
  );
}

// ─── Badge de status do save ─────────────────────────────────────────────────

function SaveBadge({
  status,
  savedAt,
  error,
  isDoctor,
  updatedBy,
}: {
  status:    SaveStatus;
  savedAt:   Date | null;
  error:     string | null;
  isDoctor:  boolean;
  updatedBy: string | null;
}) {
  const fullDate = savedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(savedAt)
    : null;

  const relative = savedAt ? formatRelative(savedAt) : null;

  // Conteúdo
  if (isDoctor && status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
        <Spinner />
        Salvando...
      </span>
    );
  }

  if (isDoctor && status === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Edição não salva
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        title={error ?? "Erro ao salvar"}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
        Falha — tentando...
      </span>
    );
  }

  if (savedAt) {
    return (
      <span
        title={fullDate ?? ""}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
        {isDoctor
          ? `Salvo ${relative}`
          : updatedBy
            ? `Atualizado ${relative} por Dr(a). ${updatedBy.split(" ")[0]}`
            : `Atualizado ${relative}`}
      </span>
    );
  }

  return (
    <span className="text-[10px] text-slate-400">
      {isDoctor ? "Auto-save ativo" : "Sem atualizações"}
    </span>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
    </svg>
  );
}

function formatRelative(date: Date): string {
  const diffSec = (Date.now() - date.getTime()) / 1000;
  if (diffSec < 30) return "agora";
  if (diffSec < 60) return `há ${Math.floor(diffSec)}s`;
  const diffMin = diffSec / 60;
  if (diffMin < 60) return `há ${Math.floor(diffMin)}min`;
  const diffH = diffMin / 60;
  if (diffH < 24) return `há ${Math.floor(diffH)}h`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

function translateGender(g: string): string {
  const k = g.toUpperCase();
  if (k === "M" || k === "MALE")   return "Masculino";
  if (k === "F" || k === "FEMALE") return "Feminino";
  if (k === "OTHER" || k === "OUTRO") return "Outro";
  return g;
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  label,
  isDoctor,
  value,
  field,
  rows = 3,
  internalOnly,
}: {
  label:    string;
  isDoctor: boolean;
  value:    string;
  field:    { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void };
  rows?:    number;
  internalOnly?: boolean;
}) {
  if (internalOnly && !isDoctor) return null;

  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {internalOnly && <span className="text-[10px] font-normal italic text-slate-400">(visível só ao médico)</span>}
      </label>
      {isDoctor ? (
        <textarea
          rows={rows}
          {...field}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          placeholder={`Adicione ${label.toLowerCase()}...`}
        />
      ) : (
        <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || <span className="italic text-slate-400">Não preenchido</span>}
        </p>
      )}
    </div>
  );
}
