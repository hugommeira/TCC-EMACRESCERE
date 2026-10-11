import { AppError, logError } from "@/lib/errors";

// ─── Config ───────────────────────────────────────────────────────────────────

const RESEND_API_URL = "https://api.resend.com/emails";
const resendKey = () => process.env["RESEND_API_KEY"] ?? "";
const emailFrom = () => process.env["EMAIL_FROM"] ?? "Emacrescere <onboarding@resend.dev>";

const RESEND_TIMEOUT_MS = 10_000;

// ─── HTTP client ─────────────────────────────────────────────────────────────

async function resendRequest(body: Record<string, unknown>): Promise<void> {
  if (!resendKey()) {
    // Sem provedor configurado: não derruba o fluxo, mas deixa claro no log.
    logError("INFRA_EMAIL_NAO_CONFIGURADO");
    return;
  }

  let res: Response;
  try {
    res = await fetch(RESEND_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${resendKey()}`,
      },
      body: JSON.stringify({ from: emailFrom(), ...body }),
    });
  } catch (err) {
    throw new AppError("AUTH_EMAIL_NAO_ENVIADO", { detail: `Resend inacessível: ${(err as Error)?.message}`, cause: err });
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new AppError("AUTH_EMAIL_NAO_ENVIADO", { detail: `Resend ${res.status}: ${JSON.stringify(errBody)}` });
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await resendRequest({
    to:      [to],
    subject: "Redefinir sua senha — Emacrescere",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Redefinir senha</h2>
        <p style="color: #334155; line-height: 1.6;">
          Recebemos uma solicitação para redefinir a senha da sua conta Emacrescere.
          Se foi você, clique no botão abaixo. Este link expira em 15 minutos.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background: #16a34a; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            Redefinir senha
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">
          Se você não solicitou isso, pode ignorar este e-mail com segurança —
          sua senha atual continua válida.
        </p>
      </div>
    `,
  });
}
