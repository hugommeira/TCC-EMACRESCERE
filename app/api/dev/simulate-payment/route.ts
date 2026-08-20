import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { processAsaasWebhook } from "@/services/api/payment";
import { toApiError }        from "@/lib/errors";
import { checkOrigin }       from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({ consultationId: z.string().min(1).max(40) });

/**
 * Simula a confirmação de pagamento sem ASAAS.
 * Apenas funciona quando PAYMENT_MOCK=true. Em produção retorna 404.
 */
export async function POST(req: NextRequest) {
  if (process.env["PAYMENT_MOCK"] !== "true") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "consultationId obrigatório" }, { status: 422 });
    }

    const consultation = await prisma.consultation.findUnique({
      where:   { id: parsed.data.consultationId },
      select:  { patientId: true, payment: { select: { id: true, asaasPaymentId: true } } },
    });
    if (!consultation)                            return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });
    if (consultation.patientId !== session.user.id) return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    if (!consultation.payment?.asaasPaymentId)    return NextResponse.json({ message: "Pagamento não encontrado" }, { status: 404 });

    // Reutiliza o caminho real do webhook -> garante que move pra fila.
    await processAsaasWebhook({
      event: "PAYMENT_RECEIVED",
      payment: {
        id:     consultation.payment.asaasPaymentId,
        status: "RECEIVED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
