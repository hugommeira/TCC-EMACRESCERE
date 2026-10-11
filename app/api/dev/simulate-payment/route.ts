import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { processAsaasWebhook } from "@/services/api/payment";
import { checkOrigin }       from "@/lib/security";
import { apiError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

const schema = z.object({ consultationId: z.string().min(1).max(40) });

/**
 * Simula a confirmação de pagamento sem ASAAS.
 * Apenas funciona quando PAYMENT_MOCK=true. Em produção retorna 404.
 */
export async function POST(req: NextRequest) {
  if (process.env["PAYMENT_MOCK"] !== "true") {
    return apiError("PAGAMENTO_SIMULACAO_DESLIGADA");
  }

  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const body   = await readJson(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });
    }

    const consultation = await prisma.consultation.findUnique({
      where:   { id: parsed.data.consultationId },
      select:  { patientId: true, payment: { select: { id: true, asaasPaymentId: true } } },
    });
    if (!consultation)                            return apiError("CONSULTA_NAO_ENCONTRADA");
    if (consultation.patientId !== session.user.id) return apiError("CONSULTA_SEM_ACESSO");
    if (!consultation.payment?.asaasPaymentId)    return apiError("PAGAMENTO_NAO_ENCONTRADO");

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
    return handleRouteError(error);
  }
}
