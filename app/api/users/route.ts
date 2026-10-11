import { NextResponse }  from "next/server";
import type { NextRequest } from "next/server";
import { auth }           from "@/lib/auth";
import { listUsers, listDoctors } from "@/services/api/user";
import { Role }           from "@prisma/client";
import { apiError, handleRouteError, intParam, enumParam } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const { searchParams } = req.nextUrl;
    const page    = intParam(searchParams, "page",  { default: 1,  min: 1 });
    const limit   = intParam(searchParams, "limit", { default: 10, min: 1, max: 100 });
    const search  = searchParams.get("search") ?? undefined;
    const role    = enumParam(searchParams, "role", Object.values(Role)) ?? null;
    const doctors = searchParams.get("doctors") === "true";

    // Rota pública (autenticada): listar médicos para agendamento
    if (doctors) {
      const specialty = searchParams.get("specialty") ?? undefined;
      const result    = await listDoctors({ page, limit, search, specialty });
      // Paciente só precisa do que aparece no card de agendamento. Antes o
      // JSON levava CPF, e-mail e telefone de todos os médicos.
      const data = result.data.map((u) => ({
        id:        u.id,
        name:      u.name,
        avatarUrl: u.avatarUrl,
        role:      u.role,
        doctorProfile: u.doctorProfile && {
          specialty:       u.doctorProfile.specialty,
          subSpecialty:    u.doctorProfile.subSpecialty,
          bio:             u.doctorProfile.bio,
          crm:             u.doctorProfile.crm,
          crmState:        u.doctorProfile.crmState,
          consultationFee: u.doctorProfile.consultationFee,
          available:       u.doctorProfile.available,
          availableHours:  u.doctorProfile.availableHours,
        },
      }));
      return NextResponse.json({ data: { ...result, data } });
    }

    // Rota admin: listar todos os usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return apiError("AUTH_SEM_PERMISSAO");
    }

    const result = await listUsers({ page, limit, search, role: role ?? undefined });
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
