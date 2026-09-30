import type { Metadata } from "next";
import Link              from "next/link";
import { validatePrescription } from "@/services/api/prescription";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Logo }          from "@/components/landing/Logo";
import { PdfHashCheck }  from "@/components/prescription/PdfHashCheck";

export const metadata: Metadata = {
  title:  "Validar receita",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// Página pública de validação. O endereço dela sai impresso em todo PDF de
// receita (validationUrl) para a farmácia conferir a autenticidade — mas a
// página nunca tinha sido criada: o link dava 404. O middleware já a listava
// como rota pública.

const TYPE_LABEL: Record<string, string> = {
  COMUM:             "Receita comum",
  COMUM_DUAS_VIAS:   "Receita comum (2 vias)",
  CONTROLE_ESPECIAL: "Receita de controle especial",
  AZUL_B1:           "Notificação de receita B1 (azul)",
  AZUL_B2:           "Notificação de receita B2 (azul)",
  AMARELA_A1:        "Notificação de receita A1 (amarela)",
  AMARELA_A2:        "Notificação de receita A2 (amarela)",
  AMARELA_A3:        "Notificação de receita A3 (amarela)",
};

/** "Mariana Castro Silva" -> "Mariana C. S." — o link é público. */
function maskName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  return [first, ...rest.map((p) => `${p[0]?.toUpperCase()}.`)].join(" ");
}

export default async function ValidatePrescriptionPage({ params }: { params: { id: string } }) {
  const { prescription: p } = await validatePrescription(params.id);

  const now      = new Date();
  const expired  = Boolean(p?.expiresAt && p.expiresAt <= now);
  const issued   = p?.status === "ISSUED";
  const testCert = Boolean(p?.signatureCN && /CERTIFICADO DE TESTE/i.test(p.signatureCN));

  const state = !p
    ? { tone: "rose",  title: "Receita não encontrada", text: "Não existe receita com este código. Confira o endereço impresso no documento." }
    : !issued
      ? { tone: "rose",  title: "Receita não emitida", text: "Este documento não foi emitido (rascunho ou cancelado) e não deve ser aceito." }
      : expired
        ? { tone: "amber", title: "Receita vencida", text: `A validade terminou em ${formatDate(p.expiresAt!)}.` }
        : { tone: "emerald", title: "Receita válida", text: p.expiresAt ? `Válida até ${formatDate(p.expiresAt)}.` : "Emitida e dentro da validade." };

  const toneCls = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber:   "border-amber-200 bg-amber-50 text-amber-900",
    rose:    "border-rose-200 bg-rose-50 text-rose-900",
  }[state.tone];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Validação de receita</span>
        </div>

        <div className={`rounded-2xl border p-5 ${toneCls}`}>
          <p className="font-display text-xl font-semibold">{state.title}</p>
          <p className="mt-1 text-sm">{state.text}</p>
        </div>

        {p && (
          <>
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <Row label="Tipo"      value={TYPE_LABEL[p.type] ?? p.type} />
              {p.issuedAt && <Row label="Emitida em" value={formatDateTime(p.issuedAt)} />}
              {p.consultation.doctor && (
                <Row
                  label="Médico"
                  value={`${p.consultation.doctor.name}${p.consultation.doctor.doctorProfile ? ` · CRM ${p.consultation.doctor.doctorProfile.crm}/${p.consultation.doctor.doctorProfile.crmState}` : ""}`}
                />
              )}
              <Row label="Paciente" value={maskName(p.consultation.patient.name)} />
              <Row label="Código"   value={p.id} mono />
            </section>

            {p.items.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medicamentos</h2>
                <ol className="mt-3 space-y-2 text-sm">
                  {p.items.map((it, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">{i + 1}. {it.name}</span>
                      <span className="block text-xs text-slate-500">{it.dosage} · {it.frequency}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assinatura digital</h2>
              {p.signatureCN ? (
                <>
                  <Row label="Assinado por" value={p.signatureCN} />
                  {p.signatureSerial && <Row label="Nº de série" value={p.signatureSerial} mono />}
                  {testCert && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
                      Assinada com <strong>certificado de teste</strong> (autoassinado, ambiente de demonstração).
                      Não tem validade jurídica e não deve ser aceita para dispensação.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-600">Este documento não possui assinatura digital registrada.</p>
              )}
              {issued && p.signatureHash && <PdfHashCheck expectedHash={p.signatureHash} />}
            </section>
          </>
        )}

        <p className="text-center text-xs text-slate-400">
          A Emacrescere não vende nem dispensa medicamentos. <Link href="/" className="underline">emacrescere</Link>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-900 sm:text-right ${mono ? "break-all font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
