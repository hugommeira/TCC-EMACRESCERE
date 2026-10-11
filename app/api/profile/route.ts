import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { updateProfileSchema } from "@/lib/validations/profile";
import { updateOwnProfile }  from "@/services/api/profile";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * PATCH /api/profile — o próprio usuário edita nome e telefone; o paciente
 * também edita os dados de saúde (nascimento, alergias, altura...).
 * E-mail, CPF, CRM e especialidade não mudam por aqui.
 */
export async function PATCH(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const rl = rateLimit({ key: `profile:${session.user.id}`, ...RL.profile });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const parsed = updateProfileSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const user = await updateOwnProfile(session.user.id, session.user.role, parsed.data);

    auditLog({
      actorId:  session.user.id,
      action:   AuditAction.PROFILE_UPDATED,
      entity:   "User",
      entityId: session.user.id,
      // Só os nomes dos campos: os valores (dados de saúde) não vão para o log.
      after:    { campos: Object.entries(parsed.data).filter(([, v]) => v !== undefined).map(([k]) => k) },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleRouteError(error);
  }
}
