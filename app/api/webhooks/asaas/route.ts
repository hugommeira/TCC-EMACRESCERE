import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processAsaasWebhook } from "@/services/api/payment";
import { auditLog, AuditAction } from "@/lib/audit";
import { apiError, handleRouteError, readJson } from "@/lib/api-response";
import { logError } from "@/lib/errors";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env["ASAAS_WEBHOOK_TOKEN"];
    if (!expected) {
      logError("WEBHOOK_NAO_CONFIGURADO");
      return apiError("WEBHOOK_NAO_CONFIGURADO");
    }

    const token = req.headers.get("asaas-access-token") ?? "";
    if (!token || !safeEqual(token, expected)) {
      void auditLog({
        action: AuditAction.WEBHOOK_AUTH_FAILED,
        entity: "Payment",
        ip:    req.headers.get("x-forwarded-for") ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
      return apiError("WEBHOOK_TOKEN_INVALIDO");
    }

    const payload = (await readJson(req)) as {
      event?:   string;
      payment?: { id?: string; status?: string };
    };

    if (!payload?.payment?.id || !payload.payment.status) {
      return apiError("WEBHOOK_PAYLOAD_INVALIDO");
    }

    // Processa síncrono pra garantir que NOTIFY entrega antes da resposta
    await processAsaasWebhook({
      event:   payload.event ?? "",
      payment: { id: payload.payment.id, status: payload.payment.status },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    // JSON inválido → 400 (não adianta o Asaas reenviar); banco fora → 503 e
    // erro inesperado → 500: o Asaas reenvia o evento mais tarde.
    return handleRouteError(err);
  }
}
