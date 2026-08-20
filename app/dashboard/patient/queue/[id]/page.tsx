import type { Metadata } from "next";
import { auth }          from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma }        from "@/lib/prisma";
import { getQueuePosition } from "@/services/api/queue";
import { DashboardShell, PageHeader } from "@/components/layout/DashboardShell";
import { PatientQueueRoom }           from "@/components/queue/PatientQueueRoom";
import { AwaitingPayment }            from "@/components/queue/AwaitingPayment";

export const metadata: Metadata = { title: "Aguardando atendimento" };
export const dynamic  = "force-dynamic";

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
      id: true, status: true, patientId: true,
      payment: { select: { status: true, pixQrCode: true, pixCopyPaste: true, boletoUrl: true, amount: true } },
    },
  });
  if (!c)                              notFound();
  if (c.patientId !== session.user.id) redirect("/dashboard/patient");

  if (c.status === "IN_PROGRESS") redirect(`/consulta/${id}`);

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
