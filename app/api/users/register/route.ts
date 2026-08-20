import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { registerPatient }  from "@/services/api/user";
import { registerSchema }   from "@/lib/validations/auth";
import { toApiError }       from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const ip = getClientIp(req);
    const rl = rateLimit({ key: `register:${ip}`, ...RL.register });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados de cadastro inválidos",
          errors:  parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const user = await registerPatient(parsed.data);

    auditLog({
      actorId:    user.id,
      actorEmail: user.email,
      action:     AuditAction.USER_REGISTER,
      entity:     "User",
      entityId:   user.id,
      ip,
      userAgent:  req.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        data: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        },
        message: "Cadastro realizado com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
