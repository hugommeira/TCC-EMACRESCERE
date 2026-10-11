import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { randomUUID }        from "node:crypto";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { publish }           from "@/lib/realtime";
import { buildKey, headObject, presignDownload, presignUpload } from "@/lib/s3";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, getClientIp, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

// ─── MIME whitelist ────────────────────────────────────────────────────────────
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

export const runtime = "nodejs";

const presignSchema = z.object({
  fileName:    z.string().min(1).max(200),
  mimeType:    z.string().refine((m) => ALLOWED_MIME.has(m), "Tipo de arquivo não permitido"),
  size:        z.number().int().positive().max(MAX_SIZE),
  kind:        z.enum(["RECEITA","LAUDO","EXAME","OUTRO"]).default("OUTRO"),
  description: z.string().max(500).optional(),
});

const confirmSchema = z.object({
  s3Key:       z.string().regex(/^emacrescere\/consultations\/[\w-]+\/[\w.-]+$/),
  fileName:    z.string().min(1).max(200),
  mimeType:    z.string().refine((m) => ALLOWED_MIME.has(m), "Tipo de arquivo não permitido"),
  size:        z.number().int().positive().max(MAX_SIZE),
  kind:        z.enum(["RECEITA","LAUDO","EXAME","OUTRO"]).default("OUTRO"),
  description: z.string().max(500).optional(),
});

async function authorize(consultationId: string, userId: string) {
  const c = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { patientId: true, doctorId: true, status: true },
  });
  if (!c) return { ok: false as const, err: "CONSULTA_NAO_ENCONTRADA" as const };
  if (c.patientId !== userId && c.doctorId !== userId) {
    return { ok: false as const, err: "CONSULTA_SEM_ACESSO" as const };
  }
  return { ok: true as const, consultation: c };
}

/** Lista anexos da consulta com URL temporária pra download. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);
    const az     = await authorize(id, session.user.id);
    if (!az.ok)  return apiError(az.err);

    const items = await prisma.attachment.findMany({
      where: { consultationId: id },
      orderBy: { createdAt: "desc" },
    });

    const withUrls = await Promise.all(
      items.map(async (a) => ({
        id:          a.id,
        kind:        a.kind,
        fileName:    a.fileName,
        mimeType:    a.mimeType,
        size:        a.size,
        description: a.description,
        createdAt:   a.createdAt,
        downloadUrl: await presignDownload({ key: a.s3Key, fileName: a.fileName, expiresIn: 600 }),
      })),
    );

    return NextResponse.json({ attachments: withUrls });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Passo 1: paciente/médico solicita URL pré-assinada para upload direto. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);

    const rl = rateLimit({ key: `att:${session.user.id}`, ...RL.attachment });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const az     = await authorize(id, session.user.id);
    if (!az.ok)  return apiError(az.err);

    const body   = await readJson(req);
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const ext   = parsed.data.fileName.split(".").pop() ?? "bin";
    const s3Key = buildKey(["consultations", id, `${randomUUID()}.${ext}`]);

    const uploadUrl = await presignUpload({
      key:         s3Key,
      contentType: parsed.data.mimeType,
      expiresIn:   60 * 5,
    });

    return NextResponse.json({ uploadUrl, s3Key });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Passo 2: cliente confirma upload concluído -> salva metadados no DB. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { id } = await Promise.resolve(ctx.params);
    const az     = await authorize(id, session.user.id);
    if (!az.ok)  return apiError(az.err);

    const body   = await readJson(req);
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    // Garantir que a key pertence à consulta corrente (anti enumeration)
    if (!parsed.data.s3Key.includes(`/consultations/${id}/`)) {
      return apiError("DADOS_INVALIDOS", { message: "Arquivo inválido." });
    }

    // Verificar real no S3: tamanho e mime
    const head = await headObject(parsed.data.s3Key);
    if (!head) {
      return apiError("ARQUIVO_NAO_ENCONTRADO");
    }
    if (head.size > MAX_SIZE) {
      return apiError("ARQUIVO_MUITO_GRANDE");
    }
    if (!ALLOWED_MIME.has(head.mimeType)) {
      return apiError("ARQUIVO_TIPO_RECUSADO");
    }

    // Usar o size real do S3 (não confiar no cliente)
    const created = await prisma.attachment.create({
      data: {
        consultationId: id,
        uploadedById:   session.user.id,
        kind:           parsed.data.kind,
        fileName:       parsed.data.fileName,
        mimeType:       head.mimeType,
        size:           head.size,
        s3Key:          parsed.data.s3Key,
        ...(parsed.data.description ? { description: parsed.data.description } : {}),
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
    return handleRouteError(error);
  }
}
