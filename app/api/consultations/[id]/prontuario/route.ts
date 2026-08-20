import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { publish }           from "@/lib/realtime";
import { toApiError }        from "@/lib/errors";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const updateSchema = z.object({
  chiefComplaint: z.string().max(1000).optional(),
  diagnosis:      z.string().max(2000).optional(),
  conduct:        z.string().max(4000).optional(),
  notes:          z.string().max(4000).optional(),
});

/** Médico edita prontuário. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    const rl = rateLimit({ key: `prontuario:${session.user.id}`, ...RL.prontuario });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const { id } = await Promise.resolve(ctx.params);
    const c = await prisma.consultation.findUnique({
      where: { id }, select: { doctorId: true },
    });
    if (!c)                            return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });
    if (c.doctorId !== session.user.id) return NextResponse.json({ message: "Você não é o médico desta consulta" }, { status: 403 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const data: Record<string, string> = {};
    if (parsed.data.chiefComplaint !== undefined) data["chiefComplaint"] = parsed.data.chiefComplaint;
    if (parsed.data.diagnosis      !== undefined) data["diagnosis"]      = parsed.data.diagnosis;
    if (parsed.data.conduct        !== undefined) data["conduct"]        = parsed.data.conduct;
    if (parsed.data.notes          !== undefined) data["notes"]          = parsed.data.notes;

    const updated = await prisma.consultation.update({
      where: { id },
      data,
      select: {
        id: true, chiefComplaint: true, diagnosis: true, conduct: true, notes: true, updatedAt: true,
        doctor: { select: { id: true, name: true } },
      },
    });

    await publish({
      channel: `consultation:${id}`,
      type:    "prontuario.updated",
      data:    {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
        updatedBy: updated.doctor?.name ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
