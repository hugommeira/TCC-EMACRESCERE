"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PrescriptionPdfModal } from "@/components/consulta/PrescriptionPdfModal";

interface Attachment {
  id:          string;
  kind:        "RECEITA"|"LAUDO"|"EXAME"|"OUTRO";
  fileName:    string;
  mimeType:    string;
  size:        number;
  description: string | null;
  createdAt:   string;
  downloadUrl: string;
}

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

interface Summary {
  id:             string;
  status:         string;
  createdAt:      string;
  startedAt:      string | null;
  endedAt:        string | null;
  chiefComplaint: string | null;
  diagnosis:      string | null;
  conduct:        string | null;
  notes:          string | null;
  patient: {
    name: string;
    cpf:  string | null;
    patientProfile: {
      birthDate: string | null;
      gender:    string | null;
      bloodType: string | null;
      allergies: string[];
      medications: string[];
    } | null;
  };
  doctor: {
    name: string;
    doctorProfile: {
      crm:       string;
      crmState:  string;
      specialty: string;
    } | null;
  } | null;
  payment: { amount: number; method: string; status: string } | null;
  prescription: ({ id: string; type: string; status: string; issuedAt: string | null; items: Item[]; notes: string | null }) | null;
  attachments: Attachment[];
}

const TYPE_LABELS: Record<string, string> = {
  COMUM:             "Receita Comum",
  COMUM_DUAS_VIAS:   "Antimicrobiano",
  CONTROLE_ESPECIAL: "Controle Especial",
  AZUL_B1:           "Azul B1",
  AZUL_B2:           "Azul B2",
  AMARELA_A1:        "Amarela A1",
  AMARELA_A2:        "Amarela A2",
  AMARELA_A3:        "Amarela A3",
};

const KIND_LABEL: Record<Attachment["kind"], string> = {
  RECEITA: "Receita", LAUDO: "Laudo", EXAME: "Exame", OUTRO: "Outro",
};
const KIND_COLOR: Record<Attachment["kind"], string> = {
  RECEITA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LAUDO:   "bg-indigo-50 text-indigo-700 ring-indigo-200",
  EXAME:   "bg-amber-50 text-amber-700 ring-amber-200",
  OUTRO:   "bg-slate-100 text-slate-700 ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "Em andamento",
  COMPLETED:   "Concluída",
  CANCELLED:   "Cancelada",
  NO_SHOW:     "Não compareceu",
  WAITING:     "Aguardando",
  SCHEDULED:   "Agendada",
};

const PT_DT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function age(birth: string | null): string | null {
  if (!birth) return null;
  const d = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${age} anos`;
}

interface Props {
  open:           boolean;
  onClose:        () => void;
  consultationId: string;
  /** Quando true, esconde queixa/diagnóstico/conduta (visão do paciente). */
  forPatient?:    boolean;
}

export function ConsultationDetailsModal({ open, onClose, consultationId, forPatient }: Props) {
  const [mounted, setMounted] = useState(false);
  const [data, setData]       = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showRx, setShowRx]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setData(null);
    void (async () => {
      try {
        const r = await fetch(`/api/consultations/${consultationId}/summary`, { cache: "no-store" });
        const json = await r.json();
        if (!r.ok) {
          setError(json.message ?? "Falha ao carregar consulta");
          return;
        }
        setData(json.consultation);
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, consultationId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const patientAge = age(data?.patient.patientProfile?.birthDate ?? null);

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/55 px-2 py-4 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex flex-none items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Consulta {data ? STATUS_LABEL[data.status] ?? data.status : ""}
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              {data?.patient.name ?? "Carregando..."}
            </h2>
            {data?.doctor && (
              <p className="truncate text-xs text-slate-500">
                Dr(a). {data.doctor.name}
                {data.doctor.doctorProfile && (
                  <> · CRM {data.doctor.doctorProfile.crm}/{data.doctor.doctorProfile.crmState}</>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
              </svg>
              Carregando consulta...
            </div>
          )}

          {error && (
            <div className="m-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4 p-4 sm:p-5">
              {/* Paciente */}
              <Section title="Paciente">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Info label="Nome"           value={data.patient.name} />
                  <Info label="Idade"          value={patientAge ?? "—"} />
                  <Info label="Sexo"           value={data.patient.patientProfile?.gender ?? "—"} />
                  <Info label="Tipo sanguíneo" value={data.patient.patientProfile?.bloodType ?? "—"} />
                </div>
                {(data.patient.patientProfile?.allergies ?? []).length > 0 && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
                    ⚠ Alergias: {data.patient.patientProfile!.allergies.join(", ")}
                  </p>
                )}
              </Section>

              {/* Quando */}
              <Section title="Atendimento">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Info label="Criada"    value={PT_DT.format(new Date(data.createdAt))} />
                  <Info label="Iniciada"  value={data.startedAt ? PT_DT.format(new Date(data.startedAt)) : "—"} />
                  <Info label="Encerrada" value={data.endedAt ? PT_DT.format(new Date(data.endedAt)) : "—"} />
                </div>
              </Section>

              {/* Anamnese / Prontuário — só médico/admin */}
              {!forPatient && (
                <Section title="Anamnese e conduta">
                  <Field label="Queixa principal" value={data.chiefComplaint} />
                  <Field label="Diagnóstico"      value={data.diagnosis} />
                  <Field label="Conduta clínica"  value={data.conduct} multiline />
                  {data.notes && (
                    <Field label="Notas internas" value={data.notes} muted multiline />
                  )}
                </Section>
              )}

              {/* Receita */}
              {data.prescription ? (
                <Section
                  title="Receituário"
                  action={
                    data.prescription.status === "ISSUED" ? (
                      <button
                        type="button"
                        onClick={() => setShowRx(true)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Ver receita
                      </button>
                    ) : null
                  }
                >
                  <p className="text-xs text-slate-600">
                    {TYPE_LABELS[data.prescription.type] ?? data.prescription.type}
                    {data.prescription.issuedAt && (
                      <> · Emitida em {PT_DT.format(new Date(data.prescription.issuedAt))}</>
                    )}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {data.prescription.items.map((it, idx) => (
                      <li key={it.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-900">{idx + 1}. {it.name}</p>
                        {(it.commercialName || it.presentation) && (
                          <p className="italic text-slate-500">
                            {[it.commercialName, it.presentation].filter(Boolean).join(" — ")}
                          </p>
                        )}
                        <p className="mt-0.5 text-slate-700">
                          {[it.dosage, it.route, it.frequency, it.duration].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {data.prescription.notes && (
                    <p className="mt-2 text-xs italic text-slate-600">Orientações: {data.prescription.notes}</p>
                  )}
                </Section>
              ) : (
                <Section title="Receituário">
                  <p className="text-xs italic text-slate-400">Nenhuma receita emitida nesta consulta.</p>
                </Section>
              )}

              {/* Anexos */}
              <Section title={`Anexos (${data.attachments.length})`}>
                {data.attachments.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Nenhum anexo.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.attachments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${KIND_COLOR[a.kind]}`}>
                            {KIND_LABEL[a.kind]}
                          </span>
                          <span className="truncate font-medium text-slate-900">{a.fileName}</span>
                          <span className="flex-none text-[10px] text-slate-400">
                            {(a.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <a
                          href={a.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-none cursor-pointer rounded-md p-1 text-slate-500 hover:text-brand-600"
                          aria-label="Baixar"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Pagamento (admin/médico vê) */}
              {data.payment && (
                <Section title="Pagamento">
                  <div className="grid grid-cols-3 gap-4">
                    <Info label="Valor"  value={`R$ ${data.payment.amount.toFixed(2).replace(".", ",")}`} />
                    <Info label="Método" value={data.payment.method} />
                    <Info label="Status" value={data.payment.status} />
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>

      {data?.prescription && (
        <PrescriptionPdfModal
          open={showRx}
          onClose={() => setShowRx(false)}
          prescriptionId={data.prescription.id}
          title="Receita assinada"
          subtitle={`Paciente: ${data.patient.name}`}
        />
      )}
    </div>,
    document.body,
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title, action, children,
}: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function Field({
  label, value, multiline, muted,
}: { label: string; value: string | null; multiline?: boolean; muted?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {value ? (
        <p className={`mt-0.5 ${multiline ? "whitespace-pre-wrap" : ""} text-sm ${muted ? "italic text-slate-600" : "text-slate-800"}`}>
          {value}
        </p>
      ) : (
        <p className="mt-0.5 text-sm italic text-slate-400">Não preenchido</p>
      )}
    </div>
  );
}
