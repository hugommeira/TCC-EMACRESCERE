import { AppError } from "@/lib/errors";

// ─── Config ───────────────────────────────────────────────────────────────────

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env["RESEND_API_KEY"] ?? "";
const EMAIL_FROM      = process.env["EMAIL_FROM"] ?? "Emacrescere <onboarding@resend.dev>";

// ─── HTTP client ─────────────────────────────────────────────────────────────

async function resendRequest(body: Record<string, unknown>): Promise<void> {
  if (!RESEND_API_KEY) {
    // Sem provedor configurado: não derruba o fluxo, mas deixa claro no log.
    console.error("[email] RESEND_API_KEY não configurada — e-mail não enviado");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: EMAIL_FROM, ...body }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error("[email] Resend error:", errBody);
    throw new AppError("Falha ao enviar e-mail", "EMAIL_SEND_FAILED", 502);
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
