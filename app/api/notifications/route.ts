import { NextResponse } from "next/server";
import { auth }          from "@/lib/auth";
import { prisma }        from "@/lib/prisma";
import { toApiError }    from "@/lib/errors";
import { doctorTitle } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface NotificationItem {
  id:    string;
  title: string;
  text:  string;
  href:  string;
  tone:  "brand" | "amber" | "rose" | "slate";
}

/**
 * GET /api/notifications — pendências do usuário logado, por perfil. Alimenta
 * o sino do TopBar (que antes era só decorativo). Não há tabela de
 * notificações: tudo é derivado do estado atual, então "lido" = resolvido.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const items: NotificationItem[] = [];
    const { id: userId, role } = session.user;

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      const [pendingDoctors, pendingPayments, liveConsultations] = await prisma.$transaction([
        prisma.doctorProfile.count({ where: { approvalStatus: "PENDING", user: { active: true } } }),
        prisma.payment.count({ where: { status: "PENDING" } }),
        prisma.consultation.count({ where: { status: { in: ["WAITING", "IN_PROGRESS"] } } }),
      ]);
      if (pendingDoctors > 0) {
        items.push({
          id: "doctors-pending", tone: "amber",
          title: `${pendingDoctors} médico(s) aguardando credenciamento`,
          text:  "Confira o CRM e aprove ou reprove.",
          href:  "/dashboard/admin/doctors",
        });
      }
      if (pendingPayments > 0) {
        items.push({
          id: "payments-pending", tone: "rose",
          title: `${pendingPayments} pagamento(s) pendente(s)`,
          text:  "Cobranças geradas e ainda não confirmadas pelo Asaas.",
          href:  "/dashboard/admin/payments",
        });
      }
      if (liveConsultations > 0) {
        items.push({
          id: "consultations-live", tone: "brand",
          title: `${liveConsultations} consulta(s) em andamento ou na fila`,
          text:  "Acompanhe a operação em tempo real.",
          href:  "/dashboard/admin/consultations",
        });
      }
    }

    if (role === "DOCTOR") {
      const profile = await prisma.doctorProfile.findUnique({
        where:  { userId },
        select: { approvalStatus: true },
      });
      if (profile?.approvalStatus === "PENDING") {
        items.push({
          id: "approval-pending", tone: "amber",
          title: "Credenciamento em análise",
          text:  "Você poderá atender assim que a equipe aprovar seu cadastro.",
          href:  "/dashboard/doctor/profile",
        });
      } else if (profile?.approvalStatus === "REJECTED") {
        items.push({
          id: "approval-rejected", tone: "rose",
          title: "Cadastro reprovado",
          text:  "Fale com a equipe Emacrescere.",
          href:  "/dashboard/doctor/profile",
        });
      } else {
        const [waiting, mine] = await prisma.$transaction([
          prisma.consultation.count({ where: { status: "WAITING", doctorId: null } }),
          prisma.consultation.count({ where: { status: "IN_PROGRESS", doctorId: userId } }),
        ]);
        if (waiting > 0) {
          items.push({
            id: "queue-waiting", tone: "brand",
            title: `${waiting} paciente(s) na fila`,
            text:  "Pegue o próximo pra iniciar o atendimento.",
            href:  "/dashboard/doctor/queue",
          });
        }
        if (mine > 0) {
          items.push({
            id: "consultation-live", tone: "amber",
            title: `${mine} consulta(s) sua(s) em andamento`,
            text:  "Volte pra sala pra continuar.",
            href:  "/dashboard/doctor/consultations",
          });
        }
      }
    }

    if (role === "PATIENT") {
      const active = await prisma.consultation.findMany({
        where:   { patientId: userId, status: { in: ["SCHEDULED", "WAITING", "IN_PROGRESS"] } },
        include: { payment: { select: { status: true } }, doctor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take:    5,
      });
      for (const c of active) {
        if (c.status === "IN_PROGRESS") {
          items.push({
            id: `c-${c.id}-live`, tone: "brand",
            title: "Sua consulta está em andamento",
            text:  c.doctor ? `${doctorTitle(c.doctor.name)} está te atendendo.` : "Entre na sala.",
            href:  `/consulta/${c.id}`,
          });
        } else if (c.status === "WAITING" && c.doctor) {
          items.push({
            id: `c-${c.id}-called`, tone: "amber",
            title: "O médico está te chamando",
            text:  `${doctorTitle(c.doctor.name)} vai iniciar sua consulta. Entre agora.`,
            href:  `/dashboard/patient/queue/${c.id}`,
          });
        } else if (c.status === "WAITING") {
          items.push({
            id: `c-${c.id}-queue`, tone: "amber",
            title: "Você está na fila",
            text:  "Mantenha a tela aberta; um médico vai pegar seu atendimento.",
            href:  `/dashboard/patient/queue/${c.id}`,
          });
        } else if (c.status === "SCHEDULED" && !c.scheduledAt && c.payment?.status === "PENDING") {
          items.push({
            id: `c-${c.id}-pay`, tone: "rose",
            title: "Pagamento pendente",
            text:  "Confirme o pagamento pra entrar na fila.",
            href:  `/dashboard/patient/queue/${c.id}`,
          });
        }
      }
    }

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
