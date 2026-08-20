import { NextResponse }       from "next/server";
import type { NextRequest }   from "next/server";
import { randomUUID }          from "node:crypto";
import { auth }                from "@/lib/auth";
import { prisma }              from "@/lib/prisma";
import { publish }             from "@/lib/realtime";
import { buildKey, putObject } from "@/lib/s3";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { toApiError }          from "@/lib/errors";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

// Mesma whitelist do PUT
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const VALID_KINDS = new Set(["RECEITA","LAUDO","EXAME","OUTRO"]);

/**
 * Upload do arquivo via servidor (sem CORS).
 * Recebe multipart/form-data com: file + kind + description?
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const { id } = await Promise.resolve(ctx.params);

    const rl = rateLimit({ key: `att:${session.user.id}`, ...RL.attachment });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const c = await prisma.consultation.findUnique({
      where:  { id },
      select: { patientId: true, doctorId: true, status: true },
    });
    if (!c)                                            return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });
    if (c.patientId !== session.user.id && c.doctorId !== session.user.id) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") ?? "OUTRO");
    const description = String(form.get("description") ?? "").slice(0, 500) || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo ausente" }, { status: 422 });
    }
    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ message: "Arquivo inválido ou maior que 50MB" }, { status: 413 });
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ message: "Tipo de arquivo não permitido" }, { status: 415 });
    }
    if (!VALID_KINDS.has(kindRaw)) {
      return NextResponse.json({ message: "kind inválido" }, { status: 422 });
    }
    const kind = kindRaw as "RECEITA" | "LAUDO" | "EXAME" | "OUTRO";

    const ext   = (file.name.split(".").pop() ?? "bin").replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "bin";
    const s3Key = buildKey(["consultations", id, `${randomUUID()}.${ext}`]);

    // Stream do file -> Buffer (ok pra 50MB)
    const arrayBuf = await file.arrayBuffer();
    const buffer   = Buffer.from(arrayBuf);

    try {
      await putObject({ key: s3Key, body: buffer, contentType: mimeType });
    } catch (s3err) {
      console.error("[attachments/upload] S3 putObject failed:", s3err);
      return NextResponse.json(
        { message: `Falha ao enviar pro storage: ${s3err instanceof Error ? s3err.message : "erro desconhecido"}` },
        { status: 502 },
      );
    }

    const created = await prisma.attachment.create({
      data: {
        consultationId: id,
        uploadedById:   session.user.id,
        kind,
        fileName:       file.name.slice(0, 200),
        mimeType,
        size:           file.size,
        s3Key,
        ...(description ? { description } : {}),
      },
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     AuditAction.ATTACHMENT_UPLOADED,
      entity:     "Attachment",
      entityId:   created.id,
      ip:         getClientIp(req),
      after:      { kind: created.kind, fileName: created.fileName, size: created.size },
    });

    await publish({
      channel: `consultation:${id}`,
      type:    "attachment.new",
      data:    {
        id:        created.id,
        kind:      created.kind,
        fileName:  created.fileName,
        mimeType:  created.mimeType,
        size:      created.size,
        createdAt: created.createdAt,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("[attachments/upload]", error);
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
