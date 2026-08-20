"use client";

import { useEffect, useRef, useState } from "react";
import { useSse } from "@/lib/hooks/useSse";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { CertificateUploadModal } from "@/components/doctor/CertificateUploadModal";
import { PrescriptionPdfModal } from "@/components/consulta/PrescriptionPdfModal";

interface MedSearch {
  id:               string;
  activeName:       string;
  commercialName:   string | null;
  presentation:     string;
  laboratory:       string | null;
  class:            "COMUM"|"ANTIMICROBIANO"|"CONTROLE_ESPECIAL"|"B1"|"B2"|"A1"|"A2"|"A3"|"GLP1";
  controlled:       boolean;
  defaultDosage:    string | null;
  defaultFrequency: string | null;
  defaultRoute:     string | null;
}

interface ItemDraft {
  tmpId:           string;
  medicationId?:   string | undefined;
  name:            string;
  commercialName?: string | undefined;
  presentation?:   string | undefined;
  dosage:          string;
  route?:          string | undefined;
  frequency:       string;
  duration?:       string | undefined;
  quantity?:       string | undefined;
  instructions?:   string | undefined;
  continuous:      boolean;
  class?:          MedSearch["class"] | undefined;
}

interface Prescription {
  id:        string;
  status:    "DRAFT" | "ISSUED" | "CANCELLED";
  type:      "COMUM"|"COMUM_DUAS_VIAS"|"CONTROLE_ESPECIAL"|"AZUL_B1"|"AZUL_B2"|"AMARELA_A1"|"AMARELA_A2"|"AMARELA_A3";
  notes:     string | null;
  issuedAt:  string | null;
  expiresAt: string | null;
  items:     Array<{
    id:             string;
    medicationId:   string | null;
    name:           string;
    commercialName: string | null;
    presentation:   string | null;
    dosage:         string;
    route:          string | null;
    frequency:      string;
    duration:       string | null;
    quantity:       string | null;
    instructions:   string | null;
    continuous:     boolean;
  }>;
}

const TYPE_LABELS: Record<Prescription["type"], string> = {
  COMUM:             "Receita Comum",
  COMUM_DUAS_VIAS:   "Antimicrobiano (2 vias)",
  CONTROLE_ESPECIAL: "Controle Especial (2 vias)",
  AZUL_B1:           "Notificação Azul B1",
  AZUL_B2:           "Notificação Azul B2",
  AMARELA_A1:        "Notificação Amarela A1",
  AMARELA_A2:        "Notificação Amarela A2",
  AMARELA_A3:        "Notificação Amarela A3",
};

const TYPE_COLOR: Record<Prescription["type"], string> = {
  COMUM:             "bg-emerald-50 text-emerald-800 ring-emerald-200",
  COMUM_DUAS_VIAS:   "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CONTROLE_ESPECIAL: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  AZUL_B1:           "bg-blue-50    text-blue-800    ring-blue-200",
  AZUL_B2:           "bg-blue-50    text-blue-800    ring-blue-200",
  AMARELA_A1:        "bg-amber-50   text-amber-800   ring-amber-300",
  AMARELA_A2:        "bg-amber-50   text-amber-800   ring-amber-300",
  AMARELA_A3:        "bg-amber-50   text-amber-800   ring-amber-300",
};

export function PrescriptionPanel({
  consultationId,
  isDoctor,
  consultationStatus,
}: {
  consultationId: string;
  isDoctor:       boolean;
  consultationStatus: "IN_PROGRESS" | "COMPLETED";
}) {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [drafts,    setDrafts]    = useState<ItemDraft[]>([]);
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [issuing,   setIssuing]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [savedAt,   setSavedAt]   = useState<Date | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const isFirst = useRef(true);

  async function load() {
    try {
      const r = await fetch(`/api/consultations/${consultationId}/prescription`, { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        const p: Prescription | null = data.prescription;
        setPrescription(p);
        if (p) {
          setNotes(p.notes ?? "");
          setDrafts(p.items.map((i, idx) => ({
            tmpId:          `db-${i.id}-${idx}`,
            ...(i.medicationId   ? { medicationId:   i.medicationId   } : {}),
            name:           i.name,
            ...(i.commercialName ? { commercialName: i.commercialName } : {}),
            ...(i.presentation   ? { presentation:  i.presentation  } : {}),
            dosage:         i.dosage,
            ...(i.route          ? { route:         i.route         } : {}),
            frequency:      i.frequency,
            ...(i.duration       ? { duration:      i.duration      } : {}),
            ...(i.quantity       ? { quantity:      i.quantity      } : {}),
            ...(i.instructions   ? { instructions:  i.instructions  } : {}),
            continuous:     i.continuous,
          })));
        } else {
          setDrafts([]);
          setNotes("");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [consultationId]);

  useSse(`/api/realtime/consultation/${consultationId}`, {
    "prescription.issued": () => { void load(); },
  });

  // Auto-save debounce (médico)
  useEffect(() => {
    if (!isDoctor) return;
    if (loading)   return;
    if (isFirst.current) { isFirst.current = false; return; }
    if (prescription?.status === "ISSUED") return;
    const t = setTimeout(() => { void save(); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, notes]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/consultations/${consultationId}/prescription`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          items: drafts.map((d) => ({
            ...(d.medicationId   ? { medicationId:   d.medicationId   } : {}),
            name:                d.name,
            ...(d.commercialName ? { commercialName: d.commercialName } : {}),
            ...(d.presentation   ? { presentation:  d.presentation   } : {}),
            dosage:              d.dosage,
            ...(d.route          ? { route:         d.route          } : {}),
            frequency:           d.frequency,
            ...(d.duration       ? { duration:      d.duration       } : {}),
            ...(d.quantity       ? { quantity:      d.quantity       } : {}),
            ...(d.instructions   ? { instructions:  d.instructions   } : {}),
            continuous:          d.continuous,
          })),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as { message?: string }));
        setError(j.message ?? "Falha ao salvar");
        return;
      }
      const data = await r.json();
      setPrescription(data.prescription);
      setSavedAt(new Date());
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  async function issue() {
    const ok = await confirmDialog({
      title:        "Emitir e assinar digitalmente?",
      message:      "A receita será assinada com seu certificado A1 e salva no S3.\nEsta ação não pode ser desfeita.",
      confirmLabel: "Emitir e assinar",
      tone:         "primary",
    });
    if (!ok) return;

    setIssuing(true);
    setError(null);
    try {
      const r = await fetch(`/api/consultations/${consultationId}/prescription/issue`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        // Sem certificado cadastrado -> abre modal de upload inline
        const noCert =
          /certificado.*não.*encontr/i.test(data.message ?? "") ||
          /certificado.*inativo/i.test(data.message ?? "") ||
          /certificado.*expirado/i.test(data.message ?? "");

        if (noCert) {
          setShowCertModal(true);
          return;
        }
        setError(data.message ?? "Falha ao emitir");
        return;
      }
      await load();
    } finally {
      setIssuing(false);
    }
  }

  // Após upload bem-sucedido do certificado, tenta emitir de novo automaticamente
  async function onCertUploaded() {
    setShowCertModal(false);
    setIssuing(true);
    setError(null);
    try {
      const r = await fetch(`/api/consultations/${consultationId}/prescription/issue`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        setError(data.message ?? "Falha ao emitir após cadastrar certificado");
        return;
      }
      await load();
    } finally {
      setIssuing(false);
    }
  }

  function addEmptyItem() {
    setDrafts((d) => [...d, {
      tmpId: `new-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      name: "", dosage: "", frequency: "", continuous: false,
    }]);
  }

  function addFromMed(m: MedSearch) {
    setDrafts((d) => [...d, {
      tmpId:          `med-${m.id}-${Date.now()}`,
      medicationId:   m.id,
      name:           m.activeName,
      ...(m.commercialName ? { commercialName: m.commercialName } : {}),
      presentation:   m.presentation,
      class:          m.class,
      dosage:         m.defaultDosage    ?? "",
      frequency:      m.defaultFrequency ?? "",
      ...(m.defaultRoute ? { route: m.defaultRoute } : {}),
      continuous:     false,
    }]);
  }

  function updateItem(tmpId: string, patch: Partial<ItemDraft>) {
    setDrafts((d) => d.map((it) => (it.tmpId === tmpId ? { ...it, ...patch } : it)));
  }

  function removeItem(tmpId: string) {
    setDrafts((d) => d.filter((it) => it.tmpId !== tmpId));
  }

  if (loading) {
    return <div className="p-4 text-sm text-slate-500">Carregando receituário...</div>;
  }

  // ─── PACIENTE (read-only) ────────────────────────────────────────────────
  if (!isDoctor) {
    return <PatientView prescription={prescription} />;
  }

  // ─── ISSUED ──────────────────────────────────────────────────────────────
  if (prescription?.status === "ISSUED") {
    return <IssuedView prescription={prescription} />;
  }

  // ─── DRAFT (médico edita) ────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Receituário</h3>
            {prescription && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${TYPE_COLOR[prescription.type]}`}>
                {TYPE_LABELS[prescription.type]}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {saving ? "Salvando..." : savedAt ? `Salvo ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Auto-save"}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <MedSearchBox onSelect={addFromMed} />

        {drafts.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
            Busque acima ou adicione um medicamento manualmente.
          </p>
        )}

        <ul className="space-y-3">
          {drafts.map((it, idx) => (
            <ItemCard
              key={it.tmpId}
              index={idx + 1}
              item={it}
              onChange={(patch) => updateItem(it.tmpId, patch)}
              onRemove={() => removeItem(it.tmpId)}
              disabled={consultationStatus === "COMPLETED" && prescription?.status === "ISSUED"}
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={addEmptyItem}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar medicamento manualmente
        </button>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Orientações gerais ao paciente
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            placeholder="Ex.: Retornar em 30 dias para reavaliação..."
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}
      </div>

      <div className="flex-none border-t border-slate-200 bg-slate-50 p-3">
        <button
          type="button"
          onClick={() => void issue()}
          disabled={issuing || drafts.length === 0 || drafts.some((d) => !d.name || !d.dosage || !d.frequency)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {issuing ? (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
              </svg>
              Assinando com certificado A1...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              Emitir e assinar digitalmente
            </>
          )}
        </button>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">
          A receita será assinada com seu certificado A1 e armazenada no S3.
        </p>
      </div>

      <CertificateUploadModal
        open={showCertModal}
        onClose={() => setShowCertModal(false)}
        onSuccess={() => void onCertUploaded()}
        title="Cadastre seu certificado A1"
        reason="Você ainda não tem um certificado digital. Carregue agora para emitir a receita."
      />
    </div>
  );
}

// ─── Busca de medicamentos ───────────────────────────────────────────────────

function MedSearchBox({ onSelect }: { onSelect: (m: MedSearch) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MedSearch[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const tref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tref.current) clearTimeout(tref.current);
    if (q.trim().length < 2) { setResults([]); return; }
    tref.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/medications/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setResults(data.items);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Buscar medicamento (base ANVISA)
      </label>
      <div className="relative mt-1.5">
        <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Ex.: tirzepatida, mounjaro, semaglutida..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Buscando...</div>}
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(m); setOpen(false); setQ(""); }}
              className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {m.activeName}{m.commercialName ? ` · ${m.commercialName}` : ""}
                </p>
                <p className="truncate text-xs text-slate-500">{m.presentation}{m.laboratory ? ` · ${m.laboratory}` : ""}</p>
              </div>
              {m.controlled && (
                <span className="flex-none rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  {m.class}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de item ────────────────────────────────────────────────────────────

function ItemCard({
  index, item, onChange, onRemove, disabled,
}: {
  index:   number;
  item:    ItemDraft;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
          {index}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            placeholder="Princípio ativo + apresentação"
            value={item.name}
            onChange={(v) => onChange({ name: v })}
            bold
            disabled={disabled}
          />
          {(item.commercialName || item.presentation) && (
            <p className="text-[11px] italic text-slate-500">
              {[item.commercialName, item.presentation].filter(Boolean).join(" — ")}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input label="Dose"       placeholder="1 comprimido" value={item.dosage}    onChange={(v) => onChange({ dosage: v })}    disabled={disabled} />
            <Input label="Frequência" placeholder="1x ao dia"    value={item.frequency} onChange={(v) => onChange({ frequency: v })} disabled={disabled} />
            <Input label="Via"        placeholder="Oral / SC / IM" value={item.route ?? ""}    onChange={(v) => onChange({ route: v || undefined })}    disabled={disabled} />
            <Input label="Duração"    placeholder="30 dias"         value={item.duration ?? ""} onChange={(v) => onChange({ duration: v || undefined })} disabled={disabled} />
            <Input label="Quantidade" placeholder="30 comprimidos" value={item.quantity ?? ""} onChange={(v) => onChange({ quantity: v || undefined })} disabled={disabled} />
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={item.continuous}
                onChange={(e) => onChange({ continuous: e.target.checked })}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Uso contínuo
            </label>
          </div>
          <textarea
            rows={2}
            value={item.instructions ?? ""}
            onChange={(e) => onChange({ instructions: e.target.value || undefined })}
            placeholder="Posologia detalhada / orientações"
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="flex-none rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          aria-label="Remover"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function Input({
  label, placeholder, value, onChange, bold, disabled,
}: {
  label?:       string;
  placeholder?: string;
  value:        string;
  onChange:    (v: string) => void;
  bold?:        boolean;
  disabled?:    boolean;
}) {
  return (
    <div>
      {label && <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 ${bold ? "font-semibold text-slate-900" : ""}`}
      />
    </div>
  );
}

// ─── Issued (receita emitida) ────────────────────────────────────────────────

function IssuedView({ prescription }: { prescription: Prescription }) {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Receituário emitido</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-200">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TYPE_COLOR[prescription.type]}`}>
            {TYPE_LABELS[prescription.type]}
          </span>
          <p className="mt-3 font-display text-lg font-semibold text-slate-900">
            Receita assinada digitalmente
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Emitida em {prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleString("pt-BR") : "—"}
            {prescription.expiresAt && (
              <> · Válida até {new Date(prescription.expiresAt).toLocaleDateString("pt-BR")}</>
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowPdf(true)}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Visualizar receita
          </button>
        </div>

        <PrescriptionPdfModal
          open={showPdf}
          onClose={() => setShowPdf(false)}
          prescriptionId={prescription.id}
          title="Receita assinada"
          subtitle={`${TYPE_LABELS[prescription.type]} · Emitida em ${prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleString("pt-BR") : "—"}`}
        />

        <ul className="mt-5 space-y-3">
          {prescription.items.map((it, idx) => (
            <li key={it.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">
                {idx + 1}. {it.name}
              </p>
              {(it.commercialName || it.presentation) && (
                <p className="mt-0.5 text-xs italic text-slate-500">
                  {[it.commercialName, it.presentation].filter(Boolean).join(" — ")}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-700">
                {[it.dosage, it.route, it.frequency, it.duration].filter(Boolean).join(" · ")}
              </p>
              {it.instructions && (
                <p className="mt-1 text-xs italic text-slate-600">{it.instructions}</p>
              )}
            </li>
          ))}
        </ul>

        {prescription.notes && (
          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Orientações:</p>
            <p className="mt-1 whitespace-pre-wrap">{prescription.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Paciente view (read-only) ───────────────────────────────────────────────

function PatientView({ prescription }: { prescription: Prescription | null }) {
  if (!prescription || prescription.status !== "ISSUED") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        Receita ainda não emitida pelo médico.
      </div>
    );
  }
  return <IssuedView prescription={prescription} />;
}
