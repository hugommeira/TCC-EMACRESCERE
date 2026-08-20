import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOnDemandConsultation, CONSULTATION_FEE_REAIS } from "@/services/api/queue";
import { initiatePayment } from "@/services/api/payment";
import { toApiError } from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({
  chiefComplaint: z.string().min(3, "Descreva sua queixa (mín. 3 caracteres)").max(500),
  method:         z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  creditCard: z
    .object({
      holderName:  z.string(),
      number:      z.string(),
      expiryMonth: z.string(),
      expiryYear:  z.string(),
      ccv:         z.string(),
      holderInfo: z.object({
        name:          z.string(),
        email:         z.string().email(),
        cpfCnpj:       z.string(),
        postalCode:    z.string(),
        addressNumber: z.string(),
        phone:         z.string(),
      }),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ message: "Apenas pacientes" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rl = rateLimit({ key: `queue.enter:${session.user.id}:${ip}`, ...RL.queueEnter });
    if (!rl.ok) {
      auditLog({
        actorId: session.user.id,
        action:  AuditAction.RATE_LIMIT_HIT,
        entity:  "Queue",
        ip,
      });
      return tooManyRequests(rl.resetSeconds);
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // 1. Criar consulta (status SCHEDULED)
    const consultation = await createOnDemandConsultation({
      patientId:      session.user.id,
      chiefComplaint: parsed.data.chiefComplaint,
    });

    // 2. Iniciar pagamento (Asaas)
    const payment = await initiatePayment({
      consultationId: consultation.id,
      patientId:      session.user.id,
      method:         parsed.data.method,
      amount:         CONSULTATION_FEE_REAIS,
      ...(parsed.data.creditCard ? { creditCard: parsed.data.creditCard } : {}),
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.CONSULTATION_CREATED,
      entity:     "Consultation",
      entityId:   consultation.id,
      ip,
    });

    return NextResponse.json(
      {
        consultation: { id: consultation.id, status: consultation.status },
        payment: {
          id:           payment.id,
          status:       payment.status,
          method:       payment.method,
          amount:       payment.amount,
          pixQrCode:    payment.pixQrCode,
          pixCopyPaste: payment.pixCopyPaste,
          boletoUrl:    payment.boletoUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
