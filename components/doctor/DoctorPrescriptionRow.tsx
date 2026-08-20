"use client";

import { useState } from "react";
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
}

export interface DoctorPrescriptionRowData {
  id:           string;
  createdAt:    string;
  patientName:  string;
  typeLabel:    string;
  status:       "DRAFT" | "ISSUED" | "CANCELLED";
  items:        Item[];
}

const STATUS_LABEL = {
  DRAFT:     "Rascunho",
  ISSUED:    "Emitida",
  CANCELLED: "Cancelada",
} as const;

const STATUS_RING = {
  DRAFT:     "bg-slate-100 text-slate-700 ring-slate-200",
  ISSUED:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-rose-50    text-rose-700    ring-rose-200",
} as const;

export function DoctorPrescriptionRow({ row }: { row: DoctorPrescriptionRowData }) {
  const [open,     setOpen]     = useState(false);
  const [showPdf,  setShowPdf]  = useState(false);

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/40">
        <td className="px-5 py-3.5 text-xs text-slate-600">{row.createdAt}</td>
        <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{row.patientName}</td>
        <td className="px-5 py-3.5 text-xs text-slate-600">{row.typeLabel}</td>
        <td className="px-5 py-3.5 text-xs text-slate-700">{row.items.length} medicamento(s)</td>
        <td className="px-5 py-3.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_RING[row.status]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {STATUS_LABEL[row.status]}
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-expanded={open}
            >
              {open ? "Ocultar" : "Detalhes"}
            </button>
            {row.status === "ISSUED" && (
              <button
                type="button"
                onClick={() => setShowPdf(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Ver receita
              </button>
            )}
          </div>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50/40">
          <td colSpan={6} className="px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Medicamentos prescritos
            </p>
            <ul className="space-y-1.5">
              {row.items.map((it, idx) => (
                <li key={it.id} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-900">
                    {idx + 1}. {it.name}
                  </p>
                  {(it.commercialName || it.presentation) && (
                    <p className="text-[11px] italic text-slate-500">
                      {[it.commercialName, it.presentation].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-slate-700">
                    {[it.dosage, it.route, it.frequency, it.duration].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}

      <PrescriptionPdfModal
        open={showPdf}
        onClose={() => setShowPdf(false)}
        prescriptionId={row.id}
        title={`Receita ${row.typeLabel}`}
        subtitle={`Paciente: ${row.patientName} · ${row.createdAt}`}
      />
    </>
  );
}
