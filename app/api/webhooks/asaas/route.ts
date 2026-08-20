import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processAsaasWebhook } from "@/services/api/payment";
import { auditLog } from "@/lib/audit";

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
      console.error("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado");
      return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
    }

    const token = req.headers.get("asaas-access-token") ?? "";
    if (!token || !safeEqual(token, expected)) {
      void auditLog({
        action: "WEBHOOK_AUTH_FAILED",
        entity: "Payment",
        ip:    req.headers.get("x-forwarded-for") ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload = (await req.json()) as {
      event?:   string;
      payment?: { id?: string; status?: string };
    };

    if (!payload?.payment?.id || !payload.payment.status) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 422 });
    }

    // Processa síncrono pra garantir que NOTIFY entrega antes da resposta
    await processAsaasWebhook({
      event:   payload.event ?? "",
      payment: { id: payload.payment.id, status: payload.payment.status },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[asaas-webhook] error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
