"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSse } from "@/lib/hooks/useSse";
import { useHeartbeat } from "@/lib/hooks/useHeartbeat";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { VideoRoom } from "./VideoRoom";
import { ChatPanel } from "./ChatPanel";
import { ProntuarioPanel } from "./ProntuarioPanel";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { PrescriptionPanel } from "./PrescriptionPanel";

interface Props {
  consultationId:   string;
  isDoctor:         boolean;
  myUserId:         string;
  patientName:      string;
  doctorName:       string | null;
  patientAge:       string | null;
  patientGender:    string | null;
  patientBloodType: string | null;
  patientMedications: string[];
  allergies:        string[];
  initialStatus:    "IN_PROGRESS" | "COMPLETED";
  startedAt:        string | null;
  endedAt:          string | null;
  claimedAt:        string | null;
  patientLastSeenAt: string | null;
  initialUpdatedAt: string | null;
  initialProntuario: {
    chiefComplaint: string | null;
    diagnosis:      string | null;
    conduct:        string | null;
    notes:          string | null;
  };
  doctorInfo: {
    name:      string;
    crm?:      string;
    specialty?: string;
  } | null;
}

type TabKey = "chat" | "prontuario" | "receituario" | "anexos";

export function ConsultationRoom(p: Props) {
  const router = useRouter();
  const [tab, setTab]       = useState<TabKey>(p.isDoctor ? "prontuario" : "chat");
  const [status, setStatus] = useState(p.initialStatus);
  const [ending, setEnding] = useState(false);
  const [marking, setMarking] = useState(false);
  const [patientLastSeen, setPatientLastSeen] = useState<string | null>(p.patientLastSeenAt);
  const [, setTick] = useState(0);

  // Heartbeat do paciente enquanto em consulta
  useHeartbeat(!p.isDoctor && status === "IN_PROGRESS" ? p.consultationId : null, 20_000);

  // Re-render a cada 10s pra atualizar timer/presença
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(i);
  }, []);

  // Médico: polling do lastSeen do paciente a cada 15s (não tem SSE específico)
  useEffect(() => {
    if (!p.isDoctor || status !== "IN_PROGRESS") return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/queue/position?id=${p.consultationId}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (data.patientLastSeenAt) setPatientLastSeen(data.patientLastSeenAt);
      } catch {}
    };
    void poll();
    const i = setInterval(poll, 15_000);
    return () => clearInterval(i);
  }, [p.isDoctor, p.consultationId, status]);

  useSse(`/api/realtime/consultation/${p.consultationId}`, {
    "consultation.ended":   () => setStatus("COMPLETED"),
    "consultation.no_show": () => setStatus("COMPLETED"),
  });

  async function endConsult() {
    const ok = await confirmDialog({
      title:   "Encerrar atendimento?",
      message: "O paciente será notificado e a consulta passará para o status concluída. Esta ação não pode ser desfeita.",
      confirmLabel: "Encerrar atendimento",
      cancelLabel:  "Continuar consulta",
      tone: "danger",
    });
    if (!ok) return;
    setEnding(true);
    const r = await fetch(`/api/consultations/${p.consultationId}/end`, { method: "POST" });
    setEnding(false);
    if (r.ok) {
      setStatus("COMPLETED");
      // Médico: volta automaticamente pra fila de espera pra próximo paciente.
      if (p.isDoctor) router.push("/dashboard/doctor/queue");
    }
  }

  async function markNoShow() {
    const ok = await confirmDialog({
      title:        "Marcar como não compareceu?",
      message:      "A consulta será encerrada como NO_SHOW e o paciente será notificado.",
      confirmLabel: "Marcar não compareceu",
      tone:         "warning",
    });
    if (!ok) return;
    setMarking(true);
    const r = await fetch(`/api/consultations/${p.consultationId}/no-show`, { method: "POST" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({} as { message?: string }));
      await confirmDialog({
        title:   "Não foi possível marcar",
        message: j.message ?? "Tente novamente em alguns segundos.",
        confirmLabel: "OK",
        cancelLabel:  "",
        tone: "warning",
      });
    } else {
      setStatus("COMPLETED");
      if (p.isDoctor) router.push("/dashboard/doctor/queue");
    }
    setMarking(false);
  }

  // 3 min após claim, libera o botão NO_SHOW
  const canMarkNoShow =
    p.isDoctor &&
    status === "IN_PROGRESS" &&
    !!p.claimedAt &&
    (Date.now() - new Date(p.claimedAt).getTime()) / 1000 > 180;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="flex flex-none items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-brand-50/60 via-white to-teal-50/40 px-3 py-2.5 shadow-sm sm:px-6 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Consulta {status === "IN_PROGRESS" ? "em andamento" : "encerrada"}
          </p>
          <h1 className="truncate font-display text-base font-semibold text-slate-900 sm:text-lg">
            {p.isDoctor ? p.patientName : (p.doctorInfo?.name ?? "Médico")}
          </h1>
          {!p.isDoctor && p.doctorInfo && (
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {p.doctorInfo.specialty} · CRM {p.doctorInfo.crm}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center gap-2">
          {p.isDoctor && status === "IN_PROGRESS" && (
            <PatientPresence lastSeen={patientLastSeen} />
          )}

          <ConsultationTimer
            startedAt={p.startedAt}
            endedAt={p.endedAt}
            status={status}
          />

          {p.isDoctor && status === "IN_PROGRESS" && (
            <>
              {canMarkNoShow && (
                <button
                  type="button"
                  onClick={() => void markNoShow()}
                  disabled={marking}
                  title="Marcar paciente como não compareceu"
                  className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60 sm:inline-flex"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {marking ? "..." : "Não compareceu"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void endConsult()}
                disabled={ending}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors hover:bg-rose-700 disabled:opacity-60 sm:px-4"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                <span className="hidden sm:inline">{ending ? "Encerrando..." : "Encerrar atendimento"}</span>
                <span className="sm:hidden">{ending ? "..." : "Encerrar"}</span>
              </button>
            </>
          )}
          {status === "COMPLETED" && (
            <button
              type="button"
              onClick={() => router.push(p.isDoctor ? "/dashboard/doctor" : "/dashboard/patient")}
              className="cursor-pointer rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:px-4"
            >
              Voltar
            </button>
          )}
        </div>
      </header>

      {/* MOBILE LAYOUT: vídeo no topo, tabs em baixo */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <div className="flex-none bg-slate-900 p-2">
          {status === "IN_PROGRESS" ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <VideoRoom consultationId={p.consultationId} />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-400">
              Vídeo encerrado
            </div>
          )}
        </div>
        <aside className="flex flex-1 flex-col overflow-hidden bg-white">
          <Tabs tab={tab} setTab={setTab} isDoctor={p.isDoctor} />
          <TabContent p={p} tab={tab} status={status} />
        </aside>
      </div>

      {/* DESKTOP LAYOUT: vídeo à esquerda, tabs à direita */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        <div className="w-3/5 flex-none p-4">
          {status === "IN_PROGRESS" ? (
            <VideoRoom consultationId={p.consultationId} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
              Vídeo encerrado
            </div>
          )}
        </div>
        <aside className="flex flex-1 flex-col border-l border-slate-200 bg-white">
          <Tabs tab={tab} setTab={setTab} isDoctor={p.isDoctor} />
          <TabContent p={p} tab={tab} status={status} />
        </aside>
      </div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function Tabs({
  tab, setTab, isDoctor,
}: { tab: TabKey; setTab: (t: TabKey) => void; isDoctor: boolean }) {
  return (
    <nav className="flex flex-none border-b border-slate-200">
      <Tab active={tab === "chat"}        onClick={() => setTab("chat")}>Chat</Tab>
      <Tab active={tab === "prontuario"}  onClick={() => setTab("prontuario")}>
        {isDoctor ? "Prontuário" : "Atendimento"}
      </Tab>
      <Tab active={tab === "receituario"} onClick={() => setTab("receituario")}>Receita</Tab>
      <Tab active={tab === "anexos"}      onClick={() => setTab("anexos")}>Anexos</Tab>
    </nav>
  );
}

function Tab({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 cursor-pointer border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
        active ? "border-brand-500 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Conteúdo da aba ──────────────────────────────────────────────────────────

function TabContent({
  p, tab, status,
}: { p: Props; tab: TabKey; status: "IN_PROGRESS" | "COMPLETED" }) {
  return (
    <div className="flex-1 overflow-hidden">
      {tab === "chat" && (
        <ChatPanel
          consultationId={p.consultationId}
          myUserId={p.myUserId}
          disabled={status === "COMPLETED"}
        />
      )}
      {tab === "prontuario" && (
        <ProntuarioPanel
          consultationId={p.consultationId}
          isDoctor={p.isDoctor}
          initial={p.initialProntuario}
          initialUpdatedAt={p.initialUpdatedAt}
          patientName={p.patientName}
          patientAge={p.patientAge}
          patientGender={p.patientGender}
          patientBloodType={p.patientBloodType}
          patientMedications={p.patientMedications}
          allergies={p.allergies}
          doctorName={p.doctorName}
        />
      )}
      {tab === "receituario" && (
        <PrescriptionPanel
          consultationId={p.consultationId}
          isDoctor={p.isDoctor}
          consultationStatus={status}
        />
      )}
      {tab === "anexos" && (
        <AttachmentsPanel
          consultationId={p.consultationId}
          isDoctor={p.isDoctor}
          canUpload={status === "IN_PROGRESS"}
        />
      )}
    </div>
  );
}

// ─── Status de presença do paciente ───────────────────────────────────────────

function PatientPresence({ lastSeen }: { lastSeen: string | null }) {
  if (!lastSeen) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
        Aguardando paciente
      </span>
    );
  }
  const secs = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (secs < 45) {
    return (
      <span title={`Paciente online (último heartbeat há ${secs}s)`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Paciente online
      </span>
    );
  }
  if (secs < 120) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Paciente ausente {secs}s
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
      Paciente offline {secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}min`}
    </span>
  );
}

// ─── Timer de duração da consulta ─────────────────────────────────────────────

function ConsultationTimer({
  startedAt, endedAt, status,
}: {
  startedAt: string | null;
  endedAt:   string | null;
  status:    "IN_PROGRESS" | "COMPLETED";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [status]);

  if (!startedAt) return null;

  const startMs = new Date(startedAt).getTime();
  const endMs   = endedAt ? new Date(endedAt).getTime() : now;
  const seconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;

  const display = hh > 0
    ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const isLive = status === "IN_PROGRESS";

  return (
    <span
      title={isLive ? "Tempo de consulta em andamento" : "Duração total"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-medium ring-1 ring-inset ${
        isLive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {isLive ? (
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      )}
      {display}
    </span>
  );
}
