import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { toApiError }        from "@/lib/errors";
import { checkOrigin, getClientIp } from "@/lib/security";
import { auditLog, AuditAction } from "@/lib/audit";
import { issuePrescription } from "@/services/api/prescription";

export const runtime  = "nodejs";
export const maxDuration = 60;

/** POST — emite (assina + salva PDF) a receita do médico. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    const { id } = await Promise.resolve(ctx.params);

    const p = await prisma.prescription.findUnique({
      where:  { consultationId: id }, select: { id: true },
    });
    if (!p) return NextResponse.json({ message: "Crie a receita antes de emitir" }, { status: 404 });

    const issued = await issuePrescription({
      prescriptionId: p.id,
      doctorId:       session.user.id,
      ...(process.env["NEXT_PUBLIC_APP_URL"] ? { appBaseUrl: process.env["NEXT_PUBLIC_APP_URL"] } : {}),
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
    console.error("[/api/consultations/:id/prescription/issue] error:", error);
    if (error instanceof Error && error.stack) console.error(error.stack);
    const err = toApiError(error);
    // Sempre repassar mensagem original (não esconder em produção neste fluxo)
    if (err.code === "INTERNAL_ERROR" && error instanceof Error) {
      err.message = error.message;
    }
    return NextResponse.json(err, { status: err.status });
  }
}
