import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { buildIcs, consultationEvent } from "@/lib/calendar";
import { SLOT_MINUTES }      from "@/lib/scheduling";
import { doctorTitle }       from "@/lib/utils";
import { appBaseUrlFromEnv } from "@/services/api/prescription";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/consultations/:id/calendar — arquivo .ics da consulta marcada,
 * para salvar na agenda do celular/computador (com lembretes). Só para o
 * paciente ou o médico da consulta, e só enquanto ela não aconteceu.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);
    const c = await prisma.consultation.findUnique({
      where:  { id },
      select: { id: true, status: true, scheduledAt: true, patientId: true, doctorId: true, doctor: { select: { name: true } } },
    });
    if (!c) return apiError("CONSULTA_NAO_ENCONTRADA");
    if (c.patientId !== session.user.id && c.doctorId !== session.user.id) return apiError("CONSULTA_SEM_ACESSO");
    if (!c.scheduledAt || (c.status !== "SCHEDULED" && c.status !== "WAITING")) {
      return apiError("CONSULTA_ENCERRADA", { message: "Esta consulta não está mais marcada." });
    }

    const ics = buildIcs(consultationEvent({
      id:          c.id,
      scheduledAt: c.scheduledAt,
      doctorLabel: c.doctor ? doctorTitle(c.doctor.name) : "seu médico",
      durationMin: SLOT_MINUTES,
      baseUrl:     appBaseUrlFromEnv() ?? req.nextUrl.origin,
    }));

    return new Response(ics, {
      headers: {
        "Content-Type":        "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="consulta-emacrescere-${c.scheduledAt.toISOString().slice(0, 10)}.ics"`,
        "Cache-Control":       "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
