import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resetPasswordWithToken } from "@/services/api/user";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { toApiError } from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const ip = getClientIp(req);
    const rl = rateLimit({ key: `reset-password:${ip}`, ...RL.resetPassword });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await req.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors:  parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    await resetPasswordWithToken(parsed.data.token, parsed.data.password);

    auditLog({
      action:    AuditAction.PASSWORD_RESET_COMPLETED,
      entity:    "User",
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
