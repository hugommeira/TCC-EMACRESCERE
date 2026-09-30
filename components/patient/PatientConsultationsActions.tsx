"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ConsultationDetailsModal } from "@/components/consulta/ConsultationDetailsModal";

interface Props {
  consultationId: string;
  status:         "SCHEDULED"|"WAITING"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"|"NO_SHOW";
  /** Pagamento confirmado. Sem isso toda consulta agendada aparecia como "Pagar". */
  paid?:          boolean;
  /** Horário já passou (consulta não paga a tempo não pode mais ser paga). */
  past?:          boolean;
}

export function PatientConsultationActions({ consultationId, status, paid = false, past = false }: Props) {
  const [open, setOpen] = useState(false);

  if (status === "IN_PROGRESS") {
    return (
      <Link
        href={`/consulta/${consultationId}` as Route}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Entrar →
      </Link>
    );
  }

  // WAITING: o médico chamou (agendamento) ou o paciente está na fila (on-demand).
  if (status === "WAITING") {
    return (
      <Link
        href={`/dashboard/patient/queue/${consultationId}` as Route}
        className="text-sm font-medium text-amber-700 hover:underline"
      >
        Entrar →
      </Link>
    );
  }

  if (status === "SCHEDULED" && !paid && past) {
    return (
      <Link
        href="/dashboard/patient/schedule"
        className="text-sm font-medium text-slate-600 hover:underline"
      >
        Agendar de novo →
      </Link>
    );
  }

  if (status === "SCHEDULED") {
    return (
      <Link
        href={`/dashboard/patient/queue/${consultationId}` as Route}
        className={`text-sm font-medium hover:underline ${paid ? "text-brand-700" : "text-slate-600"}`}
      >
        {paid ? "Ver consulta →" : "Pagar →"}
      </Link>
    );
  }

  if (status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-sm font-medium text-brand-700 hover:underline"
        >
          Ver detalhes →
        </button>
        <ConsultationDetailsModal
          open={open}
          onClose={() => setOpen(false)}
          consultationId={consultationId}
          forPatient
        />
      </>
    );
  }

  return null;
}
