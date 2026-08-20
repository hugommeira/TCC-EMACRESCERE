"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSse } from "@/lib/hooks/useSse";
import { useHeartbeat } from "@/lib/hooks/useHeartbeat";

interface QueueState {
  status:   string;
  position: number | null;
  ahead:    number;
  doctorId: string | null;
}

export function PatientQueueRoom({
  consultationId,
  initial,
}: {
  consultationId: string;
  initial:        QueueState;
}) {
  const router = useRouter();
  const [state, setState] = useState<QueueState>(initial);

  // Mantém presença viva enquanto a aba está aberta
  useHeartbeat(consultationId, 20_000);

  useSse(`/api/realtime/patient/${consultationId}`, {
    "patient.snapshot":           (data) => setState(data as QueueState),
    "patient.queued":             () => router.refresh(),
    "patient.claimed":            () => router.push(`/consulta/${consultationId}`),
    "patient.abandoned":          () => router.refresh(),
    "consultation.started":       () => router.push(`/consulta/${consultationId}`),
    "consultation.ended":         () => router.refresh(),
    "patient.no_show":            () => router.refresh(),
  });

  // fallback: polling /api/queue/position a cada 8s caso SSE falhe
  useEffect(() => {
    const i = setInterval(async () => {
      try {
        const r = await fetch(`/api/queue/position?id=${consultationId}`, { cache: "no-store" });
        if (r.ok) setState(await r.json());
      } catch {}
    }, 8000);
    return () => clearInterval(i);
  }, [consultationId]);

  if (state.status === "IN_PROGRESS") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center ring-1 ring-emerald-200">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 font-display text-xl font-semibold text-slate-900">
          Médico encontrado!
        </p>
        <p className="mt-1 text-sm text-slate-600">Redirecionando para sua consulta...</p>
      </div>
    );
  }

  if (state.status === "COMPLETED") {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center ring-1 ring-slate-200">
        <p className="font-display text-xl font-semibold text-slate-900">Consulta encerrada</p>
        <a
          href="/dashboard/patient/consultations"
          className="mt-4 inline-flex rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Ver detalhes
        </a>
      </div>
    );
  }

  if (state.status === "CANCELLED" || state.status === "NO_SHOW") {
    return (
      <div className="rounded-2xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-slate-900">
          Sua consulta foi {state.status === "NO_SHOW" ? "marcada como não compareceu" : "cancelada por inatividade"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Você ficou offline por muito tempo e perdeu sua vaga na fila.
        </p>
        <a
          href="/dashboard/patient/queue"
          className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
        >
          Nova consulta
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      {/* Pulse loader */}
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-brand-400/40" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </span>
      </div>

      <h2 className="mt-6 font-display text-2xl font-semibold text-slate-900">
        Aguardando atendimento
      </h2>

      {state.position !== null ? (
        <>
          <p className="mt-2 text-base text-slate-600">
            Você está na posição{" "}
            <strong className="font-display text-3xl text-brand-700">
              {state.position}
            </strong>
            {" "}da fila
          </p>
          {state.ahead === 0 ? (
            <p className="mt-1 text-sm text-emerald-700">
              Você é o próximo a ser atendido
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              {state.ahead} {state.ahead === 1 ? "paciente" : "pacientes"} antes de você
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-base text-slate-600">
          Estamos verificando seu status...
        </p>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Mantenha esta tela aberta. Avisamos quando um médico iniciar sua consulta.
      </p>
    </div>
  );
}
