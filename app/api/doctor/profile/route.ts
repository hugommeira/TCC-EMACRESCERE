import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { toApiError }        from "@/lib/errors";
import { checkOrigin }       from "@/lib/security";

export const runtime = "nodejs";

// Estrutura: { mon: ["08:00","18:00"], tue: [], ... }
// Array vazio = não atende. Array [start, end] = atende nesse intervalo.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z
  .array(z.string().regex(TIME_RE, "Use formato HH:MM"))
  .refine((arr) => arr.length === 0 || arr.length === 2, "Use [início, fim] ou []")
  .refine((arr) => arr.length !== 2 || arr[0]! < arr[1]!, "Início deve ser antes do fim");

const hoursSchema = z.object({
  mon: slotSchema.optional(),
  tue: slotSchema.optional(),
  wed: slotSchema.optional(),
  thu: slotSchema.optional(),
  fri: slotSchema.optional(),
  sat: slotSchema.optional(),
  sun: slotSchema.optional(),
});

const updateSchema = z.object({
  bio:             z.string().max(2000).optional(),
  subSpecialty:    z.string().max(120).optional(),
  consultationFee: z.number().nonnegative().max(100000).optional(),
  available:       z.boolean().optional(),
  availableHours:  hoursSchema.optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }
    const profile = await prisma.doctorProfile.findUnique({
      where:  { userId: session.user.id },
      select: {
        id: true, crm: true, crmState: true, specialty: true, subSpecialty: true,
        bio: true, consultationFee: true, available: true, availableHours: true,
      },
    });
    if (!profile) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
    return NextResponse.json({
      profile: {
        ...profile,
        consultationFee: Number(profile.consultationFee),
      },
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // exactOptionalPropertyTypes — só envia o que foi enviado
    const data: Record<string, unknown> = {};
    if (parsed.data.bio             !== undefined) data["bio"]             = parsed.data.bio;
    if (parsed.data.subSpecialty    !== undefined) data["subSpecialty"]    = parsed.data.subSpecialty;
    if (parsed.data.consultationFee !== undefined) data["consultationFee"] = parsed.data.consultationFee;
    if (parsed.data.available       !== undefined) data["available"]       = parsed.data.available;
    if (parsed.data.availableHours  !== undefined) data["availableHours"]  = parsed.data.availableHours;

    const updated = await prisma.doctorProfile.update({
      where: { userId: session.user.id },
      data,
      select: {
        bio: true, subSpecialty: true, consultationFee: true,
        available: true, availableHours: true,
      },
    });

    return NextResponse.json({
      profile: {
        ...updated,
        consultationFee: Number(updated.consultationFee),
      },
    });
  } catch (error) {
    console.error("[/api/doctor/profile] error:", error);
    const err = toApiError(error);
    if (err.code === "INTERNAL_ERROR" && error instanceof Error) {
      err.message = error.message;
    }
    return NextResponse.json(err, { status: err.status });
  }
}
