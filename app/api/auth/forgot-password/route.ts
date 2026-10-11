import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requestPasswordReset } from "@/services/api/user";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado, você receberá um link de redefinição em instantes.";

// Piso mínimo de tempo de resposta: sem isso, um e-mail existente (que leva
// token no banco + chamada à API do Resend) responde bem mais devagar que um
// inexistente (retorna após um único SELECT) — o tempo de resposta sozinho
// revelaria quais e-mails estão cadastrados.
const MIN_RESPONSE_MS = 500;

export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const ip = getClientIp(req);
    const rl = rateLimit({ key: `forgot-password:${ip}`, ...RL.forgotPassword });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const body   = await req.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("DADOS_INVALIDOS", { message: "E-mail inválido.", errors: { email: ["E-mail inválido"] } });
    }

    const { email } = parsed.data;

    // Rate-limit adicional por e-mail (independente do IP).
    const rlEmail = rateLimit({ key: `forgot-password:email:${email}`, ...RL.forgotPassword });
    if (!rlEmail.ok) return NextResponse.json({ message: GENERIC_MESSAGE });

    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? new URL(req.url).origin;

    const start = Date.now();
    await requestPasswordReset(email, appUrl);

    auditLog({
      actorEmail: email,
      action:     AuditAction.PASSWORD_RESET_REQUESTED,
      entity:     "User",
      ip,
      userAgent:  req.headers.get("user-agent"),
    });

    const elapsed = Date.now() - start;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    // Banco fora do ar: o usuário precisa saber que o pedido NÃO foi feito
    // (antes um 500 cru virava "verifique seu e-mail" na tela).
    return handleRouteError(error);
  }
}
