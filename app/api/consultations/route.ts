import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { scheduleConsultationSchema } from "@/lib/validations/consultation";
import { scheduleConsultation, listPatientConsultations, listDoctorConsultations, stripPartyPii } from "@/services/api/consultation";
import { apiError, validationError, handleRouteError, readJson, intParam, enumParam } from "@/lib/api-response";
import { ConsultationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const { searchParams } = req.nextUrl;
    const page   = intParam(searchParams, "page",  { default: 1,  min: 1 });
    const limit  = intParam(searchParams, "limit", { default: 10, min: 1, max: 50 });
    // Status inexistente virava erro do Prisma (500); agora é PARAMETRO_INVALIDO (422).
    const status = enumParam(searchParams, "status", Object.values(ConsultationStatus));

    const result =
      session.user.role === "DOCTOR"
        ? await listDoctorConsultations(session.user.id,  { page, limit, status })
        : await listPatientConsultations(session.user.id, { page, limit, status });

    return NextResponse.json({ data: { ...result, data: result.data.map(stripPartyPii) } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");
    // Papel errado é 403 (antes respondia 401, como se a sessão tivesse caído).
    if (session.user.role !== "PATIENT") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Só pacientes podem agendar consultas." });
    }

    const body   = await readJson(req);
    const parsed = scheduleConsultationSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const consultation = await scheduleConsultation(session.user.id, parsed.data);
    return NextResponse.json({ data: stripPartyPii(consultation) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
