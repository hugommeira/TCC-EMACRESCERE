import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { toApiError }        from "@/lib/errors";
import { checkOrigin }       from "@/lib/security";
import { upsertPrescription, getPrescriptionByConsultation } from "@/services/api/prescription";

export const runtime = "nodejs";

const itemSchema = z.object({
  medicationId:    z.string().optional(),
  name:            z.string().min(1).max(300),
  commercialName:  z.string().max(300).optional(),
  presentation:    z.string().max(300).optional(),
  dosage:          z.string().min(1).max(120),
  route:           z.string().max(80).optional(),
  frequency:       z.string().min(1).max(120),
  duration:        z.string().max(120).optional(),
  quantity:        z.string().max(120).optional(),
  instructions:    z.string().max(1000).optional(),
  continuous:      z.boolean().optional(),
});

const upsertSchema = z.object({
  items: z.array(itemSchema).max(30),
  notes: z.string().max(2000).optional(),
});

/** GET — paciente, médico ou admin lê a prescrição da consulta. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const { id } = await Promise.resolve(ctx.params);
    const c = await prisma.consultation.findUnique({
      where:  { id }, select: { patientId: true, doctorId: true },
    });
    if (!c) return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });

    const allowed =
      c.patientId === session.user.id ||
      c.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) return NextResponse.json({ message: "Sem permissão" }, { status: 403 });

    const prescription = await getPrescriptionByConsultation(id);
    return NextResponse.json({ prescription });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

/** PUT — médico cria/atualiza o draft da receita. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    const { id } = await Promise.resolve(ctx.params);

    const body   = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    // Limpa campos undefined antes de passar (exactOptionalPropertyTypes)
    const items = parsed.data.items.map((it) => {
      const out: Record<string, unknown> = {
        name:      it.name,
        dosage:    it.dosage,
        frequency: it.frequency,
      };
      if (it.medicationId)   out["medicationId"]   = it.medicationId;
      if (it.commercialName) out["commercialName"] = it.commercialName;
      if (it.presentation)   out["presentation"]   = it.presentation;
      if (it.route)          out["route"]          = it.route;
      if (it.duration)       out["duration"]       = it.duration;
      if (it.quantity)       out["quantity"]       = it.quantity;
      if (it.instructions)   out["instructions"]   = it.instructions;
      if (it.continuous !== undefined) out["continuous"] = it.continuous;
      return out as unknown as Parameters<typeof upsertPrescription>[0]["items"][number];
    });

    const p = await upsertPrescription({
      consultationId: id,
      doctorId:       session.user.id,
      items,
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    });

    return NextResponse.json({ prescription: p });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
