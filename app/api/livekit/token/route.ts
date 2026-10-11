import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { createRoomToken, livekitUrl, roomNameFor } from "@/lib/livekit";
import { RL, rateLimit, tooManyRequests } from "@/lib/security";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const rl = rateLimit({ key: `livekit:${session.user.id}`, ...RL.livekitToken });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const consultationId = req.nextUrl.searchParams.get("consultationId");
    if (!consultationId) {
      return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });
    }

    const c = await prisma.consultation.findUnique({
      where:  { id: consultationId },
      select: { id: true, status: true, patientId: true, doctorId: true, livekitRoom: true },
    });
    if (!c) return apiError("CONSULTA_NAO_ENCONTRADA");

    const isParticipant =
      c.patientId === session.user.id || c.doctorId === session.user.id;
    if (!isParticipant) {
      return apiError("CONSULTA_SEM_ACESSO");
    }
    if (c.status !== "IN_PROGRESS") {
      return apiError("VIDEO_CONSULTA_NAO_INICIADA");
    }

    const role: "DOCTOR" | "PATIENT" =
      c.doctorId === session.user.id ? "DOCTOR" : "PATIENT";

    const token = await createRoomToken({
      identity: session.user.id,
      name:     session.user.name,
      role,
      roomName: c.livekitRoom ?? roomNameFor(c.id),
    });

    return NextResponse.json({
      token,
      url:      livekitUrl(),
      roomName: c.livekitRoom ?? roomNameFor(c.id),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
