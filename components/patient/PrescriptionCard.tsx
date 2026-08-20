"use client";

import { useState } from "react";
import { SectionCard } from "@/components/layout/DashboardShell";
import { PrescriptionPdfModal } from "@/components/consulta/PrescriptionPdfModal";

interface Item {
  id:             string;
  name:           string;
  commercialName: string | null;
  presentation:   string | null;
  dosage:         string;
  route:          string | null;
  frequency:      string;
  duration:       string | null;
  instructions:   string | null;
}

interface Prescription {
  id:        string;
  type:      string;
  typeLabel: string;
  issuedAt:  string | null;
  expiresAt: string | null;
  notes:     string | null;
  items:     Item[];
  doctor:    { name: string; crm: string | null; crmState: string | null } | null;
}

const PT_DT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});
const PT_D  = new Intl.DateTimeFormat("pt-BR");

export function PatientPrescriptionCard({ prescription }: { prescription: Prescription }) {
  const [open, setOpen] = useState(false);
  const subtitle = prescription.doctor
    ? `Dr(a). ${prescription.doctor.name}${prescription.doctor.crm ? ` · CRM ${prescription.doctor.crm}/${prescription.doctor.crmState ?? ""}` : ""}`
    : "Médico";

  return (
    <SectionCard
      title={prescription.typeLabel}
      description={subtitle}
      action={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Visualizar
        </button>
      }
    >
      <p className="text-xs text-slate-500">
        Emitida em {prescription.issuedAt ? PT_DT.format(new Date(prescription.issuedAt)) : "—"}
        {prescription.expiresAt && (
          <> · Válida até {PT_D.format(new Date(prescription.expiresAt))}</>
        )}
      </p>

      <ul className="mt-3 space-y-2">
        {prescription.items.map((it, idx) => (
          <li key={it.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="font-medium text-slate-900">{idx + 1}. {it.name}</p>
            {(it.commercialName || it.presentation) && (
              <p className="text-xs italic text-slate-500">
                {[it.commercialName, it.presentation].filter(Boolean).join(" — ")}
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-700">
              {[it.dosage, it.route, it.frequency, it.duration].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {prescription.notes && (
        <div className="mt-3 rounded-lg bg-amber-50/60 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          <strong>Orientações: </strong>{prescription.notes}
        </div>
      )}

      <PrescriptionPdfModal
        open={open}
        onClose={() => setOpen(false)}
        prescriptionId={prescription.id}
        title={prescription.typeLabel}
        subtitle={subtitle}
      />
    </SectionCard>
  );
}
