"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ConsultationDetailsModal } from "@/components/consulta/ConsultationDetailsModal";

interface Props {
  consultationId: string;
  status:         "SCHEDULED"|"WAITING"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"|"NO_SHOW";
}

export function DoctorConsultationActions({ consultationId, status }: Props) {
  const [open, setOpen] = useState(false);

  // Em andamento → link para sala viva
  if (status === "IN_PROGRESS") {
    return (
      <Link
        href={`/consulta/${consultationId}` as Route}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        Continuar →
      </Link>
    );
  }

  // Encerrada / cancelada / no-show → modal de detalhes
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
        />
      </>
    );
  }

  // Agendada / em espera → página da consulta (onde ficam "Chamar paciente",
  // "Iniciar", "Cancelar"). Antes retornava null e o médico não tinha como
  // chegar lá a partir da lista.
  return (
    <Link
      href={`/dashboard/doctor/consultations/${consultationId}` as Route}
      className="text-sm font-medium text-brand-700 hover:underline"
    >
      Abrir →
    </Link>
  );
}
