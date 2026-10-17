import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { getPatientHistoryForDoctor } from "@/services/api/prontuario-history";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/consultations/:id/history — consultas anteriores do paciente desta
 * consulta, só as que este médico fez (queixa, diagnóstico, conduta, notas
 * internas e medicamentos da receita emitida). Só o médico da consulta: o
 * paciente nunca recebe as notas internas.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);
    const c = await prisma.consultation.findUnique({
      where:  { id },
      select: { id: true, patientId: true, doctorId: true },
    });
    if (!c) return apiError("CONSULTA_NAO_ENCONTRADA");
    if (c.doctorId !== session.user.id) {
      return apiError("CONSULTA_SEM_ACESSO", { message: "Só o médico da consulta vê o histórico do paciente." });
    }

    const history = await getPatientHistoryForDoctor({
      patientId: c.patientId, doctorId: session.user.id, excludeConsultationId: c.id,
    });
    return NextResponse.json({ data: history });
  } catch (error) {
    return handleRouteError(error);
  }
}
