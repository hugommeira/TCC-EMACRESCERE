import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resetPasswordWithToken } from "@/services/api/user";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { validationError, handleRouteError } from "@/lib/api-response";

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
      return validationError(parsed.error);
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
    return handleRouteError(error);
  }
}
