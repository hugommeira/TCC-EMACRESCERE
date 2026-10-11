import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { checkOrigin }       from "@/lib/security";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

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

// Mesmo shape no GET e no PATCH: o app mobile parseia os dois com o mesmo
// modelo e precisa do status de credenciamento pra decidir a tela.
const PROFILE_SELECT = {
  id: true, crm: true, crmState: true, specialty: true, subSpecialty: true,
  bio: true, consultationFee: true, available: true, availableHours: true,
  approvalStatus: true, approvalNote: true, approvedAt: true,
  crmVerifiedAt: true, crmVerification: true,
} as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    const profile = await prisma.doctorProfile.findUnique({
      where:  { userId: session.user.id },
      select: PROFILE_SELECT,
    });
    if (!profile) return apiError("NAO_ENCONTRADO", { message: "Perfil de médico não encontrado." });
    return NextResponse.json({
      profile: {
        ...profile,
        consultationFee: Number(profile.consultationFee),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }

    const body   = await readJson(req);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
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
      select: PROFILE_SELECT,
    });

    return NextResponse.json({
      profile: {
        ...updated,
        consultationFee: Number(updated.consultationFee),
      },
    });
  } catch (error) {
    // Perfil inexistente no update vira NAO_ENCONTRADO (P2025) em toApiError;
    // antes a mensagem crua do Prisma era mostrada ao médico.
    return handleRouteError(error);
  }
}
