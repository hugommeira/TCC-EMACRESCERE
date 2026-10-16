import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { checkOrigin, getClientIp } from "@/lib/security";
import { auditLog, AuditAction } from "@/lib/audit";
import { appBaseUrlFromEnv, issuePrescription } from "@/services/api/prescription";
import { apiError, handleRouteError } from "@/lib/api-response";
import { assertEncryptionKey } from "@/lib/crypto";

export const runtime  = "nodejs";
export const maxDuration = 60;

/** POST — emite (assina + salva PDF) a receita do médico. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }

    const { id } = await Promise.resolve(ctx.params);

    // Sem a chave nenhum certificado abre: falha cedo, com o código certo.
    assertEncryptionKey();

    const p = await prisma.prescription.findUnique({
      where:  { consultationId: id }, select: { id: true },
    });
    if (!p) return apiError("RECEITA_NAO_ENCONTRADA", { message: "Crie a receita antes de emitir." });

    const issued = await issuePrescription({
      prescriptionId: p.id,
      doctorId:       session.user.id,
      ...(appBaseUrlFromEnv() ? { appBaseUrl: appBaseUrlFromEnv() } : {}),
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.PRESCRIPTION_ISSUED,
      entity:     "Prescription",
      entityId:   issued.id,
      ip:         getClientIp(req),
      after:      { type: issued.type },
    });

    return NextResponse.json({
      id:        issued.id,
      status:    issued.status,
      type:      issued.type,
      issuedAt:  issued.issuedAt,
      expiresAt: issued.expiresAt,
    });
  } catch (error) {
    // Erros de certificado/assinatura/PDF já vêm com código do catálogo; o
    // texto técnico vai só para o log (antes vazava para o usuário em produção).
    return handleRouteError(error);
  }
}
