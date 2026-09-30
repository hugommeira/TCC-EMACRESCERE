import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { toApiError }        from "@/lib/errors";
import { auditLog }          from "@/lib/audit";
import { checkOrigin, getClientIp, rateLimit, tooManyRequests } from "@/lib/security";
import { generateTestCertificate } from "@/services/api/certificate";

export const runtime     = "nodejs";
export const dynamic     = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/doctor/certificate/test — gera e instala um certificado A1
 * autoassinado de TESTE pro médico logado (ver generateTestCertificate).
 *
 * Existe pra demonstração: sem ele, emitir receita exige um certificado
 * ICP-Brasil real. A receita sai assinada, mas sem validade jurídica.
 */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    // Gerar chave RSA é caro; evita abuso.
    const rl = rateLimit({ key: `cert-test:${session.user.id}`, limit: 3, windowSec: 60 * 10 });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const cert = await generateTestCertificate(session.user.id);

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     "doctor.test_certificate_generated",
      entity:     "MedicalCertificate",
      entityId:   cert.id,
      ip:         getClientIp(req),
      userAgent:  req.headers.get("user-agent"),
    });

    return NextResponse.json({ certificate: cert }, { status: 201 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
