import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma }        from "@/lib/prisma";
import { getQueuePosition } from "@/services/api/queue";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { PatientQueueRoom }           from "@/components/queue/PatientQueueRoom";
import { AwaitingPayment }            from "@/components/queue/AwaitingPayment";
import { ScheduledConsultationWatcher } from "@/components/patient/ScheduledConsultationWatcher";
import { ScheduledPaymentForm }       from "@/components/patient/ScheduledPaymentForm";
import { CancelConsultationButton }   from "@/components/patient/CancelConsultationButton";
import { CancellationPolicy }         from "@/components/patient/CancellationPolicy";
import { doctorTitle, formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Sua consulta" };
export const dynamic  = "force-dynamic";

// Esta rota, apesar do nome "queue", é a página da consulta do paciente e
// atende os dois fluxos: fila on-demand (sem scheduledAt) e agendamento (com
// scheduledAt). O agendamento tem um ramo próprio, sem nenhum texto de fila.

export default async function PatientQueueRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const c = await prisma.consultation.findUnique({
    where:  { id },
    select: {
      id: true, status: true, patientId: true, scheduledAt: true,
      doctor:  { select: { name: true, doctorProfile: { select: { consultationFee: true } } } },
      payment: { select: { status: true, method: true, pixQrCode: true, pixCopyPaste: true, boletoUrl: true, amount: true } },
    },
  });
  if (!c)                              notFound();
  if (c.patientId !== session.user.id) redirect("/dashboard/patient");

  if (c.status === "IN_PROGRESS") redirect(`/consulta/${id}`);

  if (c.scheduledAt) {
    return <ScheduledConsultationView c={{ ...c, scheduledAt: c.scheduledAt }} />;
  }

  // Pagamento ainda não confirmado
  if (c.status === "SCHEDULED") {
    const isMock = process.env["PAYMENT_MOCK"] === "true";
    return (
      <DashboardShell>
        <PageHeader
          badge="Aguardando pagamento"
          title="Confirme seu pagamento"
          description="Assim que o pagamento for confirmado, você entra na fila automaticamente."
        />
        <AwaitingPayment
          consultationId={id}
          pixQrCode={c.payment?.pixQrCode ?? null}
          pixCopyPaste={c.payment?.pixCopyPaste ?? null}
          amount={Number(c.payment?.amount ?? 0)}
          isMock={isMock}
        />
      </DashboardShell>
    );
  }

  const initial = await getQueuePosition(id);

  return (
    <DashboardShell>
      <PageHeader
        badge="Na fila"
        title="Você está na fila"
        description="Mantenha esta tela aberta. Um médico vai pegar seu atendimento."
      />
      <div className="mx-auto max-w-md">
        <PatientQueueRoom
          consultationId={id}
          initial={{
            status:   initial.status,
            position: initial.position,
            ahead:    initial.ahead,
            doctorId: initial.doctorId,
          }}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Consulta agendada ────────────────────────────────────────────────────────

interface ScheduledProps {
  id:          string;
  status:      string;
  scheduledAt: Date;
  doctor:      { name: string; doctorProfile: { consultationFee: unknown } | null } | null;
  payment:     {
    status:       string;
    method:       string;
    pixQrCode:    string | null;
    pixCopyPaste: string | null;
    boletoUrl:    string | null;
    amount:       unknown;
  } | null;
}

function ScheduledConsultationView({ c }: { c: ScheduledProps }) {
  const when       = formatDateTime(c.scheduledAt);
  const doctorName = c.doctor ? doctorTitle(c.doctor.name) : "seu médico";
  const payStatus  = c.payment?.status ?? null;
  const paid       = payStatus === "RECEIVED" || payStatus === "CONFIRMED";
  const fee        = Number(c.payment?.amount ?? c.doctor?.doctorProfile?.consultationFee ?? 0);

  const summary = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-400">Data e horário</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{when}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-400">Médico</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{doctorName}</dd>
        </div>
      </dl>
    </div>
  );

  // Encerrada, cancelada ou falta: nada a acompanhar.
  if (c.status === "COMPLETED" || c.status === "CANCELLED" || c.status === "NO_SHOW") {
    const label = { COMPLETED: "Consulta concluída", CANCELLED: "Consulta cancelada", NO_SHOW: "Consulta marcada como falta" }[c.status];
    return (
      <DashboardShell>
        <PageHeader badge="Agendamento" title={label} description={`${doctorName} · ${when}`} />
        <div className="mx-auto max-w-md space-y-4">
          {c.status === "CANCELLED" && payStatus === "REFUNDED" && (
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
              O valor de {formatCurrency(fee)} foi estornado pela mesma forma de pagamento. O prazo de
              devolução depende do banco ou da operadora.
            </p>
          )}
          {c.status === "CANCELLED" && paid && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
              Cancelada com menos de 24 horas de antecedência — sem estorno, conforme a política de cancelamento.
            </p>
          )}
          <Link
            href="/dashboard/patient/consultations"
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Ver minhas consultas
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // Horário passou sem pagamento: não dá mais pra pagar (o servidor recusa).
  // Antes a tela oferecia "pagar" uma consulta de dias atrás.
  if (c.status === "SCHEDULED" && !paid && c.scheduledAt.getTime() <= Date.now()) {
    return (
      <DashboardShell>
        <PageHeader
          badge="Expirada"
          title="O horário desta consulta já passou"
          description="Ela não foi paga a tempo. Escolha um novo horário para agendar de novo."
        />
        <div className="mx-auto max-w-md space-y-4">
          {summary}
          <Link
            href="/dashboard/patient/schedule"
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Agendar novo horário
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // Médico chamou (WAITING): a sala abre quando ele iniciar.
  if (c.status === "WAITING") {
    return (
      <DashboardShell>
        <PageHeader
          badge="Agora"
          title={`${doctorName} está te chamando`}
          description="A sala da consulta vai abrir nesta tela assim que o médico iniciar o atendimento."
        />
        <div className="mx-auto max-w-md space-y-4">
          {summary}
          <ScheduledConsultationWatcher consultationId={c.id} status={c.status} paymentStatus={payStatus} />
        </div>
      </DashboardShell>
    );
  }

  // SCHEDULED e pago: confirmada, esperando o horário.
  if (paid) {
    return (
      <DashboardShell>
        <PageHeader
          badge="Confirmada"
          title="Sua consulta está confirmada"
          description="No horário marcado, o médico te chama por aqui. Você pode fechar esta página e voltar perto da hora."
        />
        <div className="mx-auto max-w-md space-y-4">
          {summary}
          <div className="rounded-2xl bg-brand-50/70 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
            Pagamento de {formatCurrency(fee)} confirmado. Chegando a hora, o aviso também aparece no sino do painel.
          </div>
          <CancelConsultationButton consultationId={c.id} scheduledAt={c.scheduledAt.toISOString()} paid />
          <CancellationPolicy />
          <ScheduledConsultationWatcher consultationId={c.id} status={c.status} paymentStatus={payStatus} />
        </div>
      </DashboardShell>
    );
  }

  // SCHEDULED com cobrança aberta: mostra como pagar e espera a confirmação.
  if (payStatus === "PENDING" && c.payment) {
    const isMock = process.env["PAYMENT_MOCK"] === "true";
    return (
      <DashboardShell>
        <PageHeader
          badge="Aguardando pagamento"
          title="Confirme seu pagamento"
          description={`O horário de ${when} com ${doctorName} fica garantido assim que o pagamento for confirmado.`}
        />
        <div className="mx-auto max-w-md space-y-4">
          {c.payment.method === "BOLETO" && c.payment.boletoUrl ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <p className="font-semibold text-slate-900">Boleto de {formatCurrency(fee)}</p>
              <p className="text-sm text-slate-500">A compensação do boleto pode levar até 3 dias úteis.</p>
              <a
                href={c.payment.boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Abrir boleto
              </a>
            </div>
          ) : c.payment.method === "PIX" ? (
            <AwaitingPayment
              consultationId={c.id}
              pixQrCode={c.payment.pixQrCode}
              pixCopyPaste={c.payment.pixCopyPaste}
              amount={fee}
              isMock={isMock}
            />
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
              Pagamento com cartão em processamento.
            </p>
          )}
          {summary}
          <CancellationPolicy />
          <CancelConsultationButton consultationId={c.id} scheduledAt={c.scheduledAt.toISOString()} paid={false} />
          <ScheduledConsultationWatcher consultationId={c.id} status={c.status} paymentStatus={payStatus} />
        </div>
      </DashboardShell>
    );
  }

  // SCHEDULED sem cobrança (saiu antes de pagar) ou com cobrança vencida.
  return (
    <DashboardShell>
      <PageHeader
        badge="Pagamento pendente"
        title="Falta pagar sua consulta"
        description={`Escolha como pagar para garantir o horário de ${when} com ${doctorName}.`}
      />
      <div className="mx-auto max-w-md space-y-4">
        {summary}
        <CancellationPolicy />
        <ScheduledPaymentForm consultationId={c.id} amount={fee} doctorName={c.doctor?.name ?? ""} />
        <CancelConsultationButton consultationId={c.id} scheduledAt={c.scheduledAt.toISOString()} paid={false} />
      </div>
    </DashboardShell>
  );
}
