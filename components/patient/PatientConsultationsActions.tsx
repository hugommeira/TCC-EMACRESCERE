"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ConsultationDetailsModal } from "@/components/consulta/ConsultationDetailsModal";

interface Props {
  consultationId: string;
  status:         "SCHEDULED"|"WAITING"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED"|"NO_SHOW";
}

export function PatientConsultationActions({ consultationId, status }: Props) {
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

  if (status === "WAITING") {
    return (
      <Link
        href={`/dashboard/patient/queue/${consultationId}` as Route}
        className="text-sm font-medium text-amber-700 hover:underline"
      >
        Ver fila →
      </Link>
    );
  }

  if (status === "SCHEDULED") {
    return (
      <Link
        href={`/dashboard/patient/queue/${consultationId}` as Route}
        className="text-sm font-medium text-slate-600 hover:underline"
      >
        Pagar →
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
