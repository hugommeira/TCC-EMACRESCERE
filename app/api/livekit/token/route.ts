import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { createRoomToken, livekitUrl, roomNameFor } from "@/lib/livekit";
import { toApiError }        from "@/lib/errors";
import { RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const rl = rateLimit({ key: `livekit:${session.user.id}`, ...RL.livekitToken });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const consultationId = req.nextUrl.searchParams.get("consultationId");
    if (!consultationId) {
      return NextResponse.json({ message: "consultationId obrigatório" }, { status: 422 });
    }

    const c = await prisma.consultation.findUnique({
      where:  { id: consultationId },
      select: { id: true, status: true, patientId: true, doctorId: true, livekitRoom: true },
    });
    if (!c) return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });

    const isParticipant =
      c.patientId === session.user.id || c.doctorId === session.user.id;
    if (!isParticipant) {
      return NextResponse.json({ message: "Você não participa desta consulta" }, { status: 403 });
    }
    if (c.status !== "IN_PROGRESS") {
      return NextResponse.json({ message: "Consulta não está em andamento" }, { status: 409 });
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
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
