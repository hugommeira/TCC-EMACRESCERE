import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { toApiError }        from "@/lib/errors";
import { auditLog }          from "@/lib/audit";
import { checkOrigin, getClientIp } from "@/lib/security";
import {
  uploadCertificate, getCertificateInfo, deleteCertificate,
} from "@/services/api/certificate";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

/** GET — retorna metadados do certificado atual (sem o arquivo) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }
    const info = await getCertificateInfo(session.user.id);
    return NextResponse.json({ certificate: info ?? null });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

/** POST — upload do .pfx + senha (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    if (!process.env["PFX_ENCRYPTION_KEY"]) {
      console.error("[/api/doctor/certificate] PFX_ENCRYPTION_KEY ausente");
      return NextResponse.json(
        { message: "Servidor mal configurado (PFX_ENCRYPTION_KEY). Contate o administrador." },
        { status: 500 },
      );
    }

    const form     = await req.formData();
    const file     = form.get("file");
    const password = String(form.get("password") ?? "");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo .pfx ausente" }, { status: 422 });
    }
    if (!password) {
      return NextResponse.json({ message: "Senha obrigatória" }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let cert;
    try {
      cert = await uploadCertificate({
        doctorId:  session.user.id,
        pfxBuffer: buffer,
        password,
        fileName:  file.name.slice(0, 200),
      });
    } catch (err) {
      // Log completo do erro real no servidor
      console.error("[/api/doctor/certificate] uploadCertificate threw:", err);
      // ConflictError / AppError já têm mensagem amigável — propaga via toApiError
      const out = toApiError(err);
      // Garante mensagem útil no client (não esconder em prod nesse endpoint)
      if (out.code === "INTERNAL_ERROR" && err instanceof Error) {
        out.message = err.message;
      }
      return NextResponse.json(out, { status: out.status });
    }

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     "certificate.uploaded",
      entity:     "MedicalCertificate",
      entityId:   cert.id,
      ip:         getClientIp(req),
    });

    return NextResponse.json({ certificate: cert }, { status: 201 });
  } catch (error) {
    console.error("[/api/doctor/certificate] outer error:", error);
    const err = toApiError(error);
    if (err.code === "INTERNAL_ERROR" && error instanceof Error) {
      err.message = error.message;
    }
    return NextResponse.json(err, { status: err.status });
  }
}

/** DELETE — remove certificado do médico */
export async function DELETE(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
    }

    await deleteCertificate(session.user.id);

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     "certificate.deleted",
      entity:     "MedicalCertificate",
      ip:         getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
