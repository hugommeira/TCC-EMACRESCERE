import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog }          from "@/lib/audit";
import { assertEncryptionKey } from "@/lib/crypto";
import { checkOrigin, getClientIp } from "@/lib/security";
import {
  uploadCertificate, getCertificateInfo, deleteCertificate,
} from "@/services/api/certificate";
import { apiError, handleRouteError, readFormData } from "@/lib/api-response";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

/** GET — retorna metadados do certificado atual (sem o arquivo) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }
    const info = await getCertificateInfo(session.user.id);
    return NextResponse.json({ certificate: info ?? null });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST — upload do .pfx + senha (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }

    // Sem a chave (ou com tamanho errado) nada pode ser cifrado: CERTIFICADO_CHAVE_SERVIDOR.
    assertEncryptionKey();

    const form     = await readFormData(req);
    const file     = form.get("file");
    const password = String(form.get("password") ?? "");
    if (!(file instanceof File)) {
      return apiError("ARQUIVO_AUSENTE", { message: "Selecione o arquivo .pfx ou .p12." });
    }
    if (!password) {
      return apiError("CERTIFICADO_SENHA_INVALIDA", { message: "Digite a senha do certificado." });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Erros do upload já vêm com código do catálogo (senha, arquivo, chave,
    // storage). Antes a mensagem técnica crua era repassada ao usuário.
    const cert = await uploadCertificate({
      doctorId:  session.user.id,
      pfxBuffer: buffer,
      password,
      fileName:  file.name.slice(0, 200),
    });

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
    return handleRouteError(error);
  }
}

/** DELETE — remove certificado do médico */
export async function DELETE(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
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
    return handleRouteError(error);
  }
}
