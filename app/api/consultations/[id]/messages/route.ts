import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { z }                 from "zod";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { publish }           from "@/lib/realtime";
import { toApiError }        from "@/lib/errors";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  type:    z.enum(["TEXT","IMAGE","FILE","SYSTEM"]).optional(),
  fileUrl: z.string().url().optional(),
});

async function authorize(consultationId: string, userId: string) {
  const c = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { patientId: true, doctorId: true, status: true },
  });
  if (!c) return { ok: false as const, code: 404, msg: "Consulta não encontrada" };
  if (c.patientId !== userId && c.doctorId !== userId) {
    return { ok: false as const, code: 403, msg: "Sem permissão" };
  }
  return { ok: true as const, consultation: c };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const { id } = await Promise.resolve(ctx.params);
    const az     = await authorize(id, session.user.id);
    if (!az.ok)  return NextResponse.json({ message: az.msg }, { status: az.code });

    const cursor = req.nextUrl.searchParams.get("cursor");
    const take   = Math.min(Number(req.nextUrl.searchParams.get("take") ?? 50), 100);

    const messages = await prisma.message.findMany({
      where: { consultationId: id },
      orderBy: { createdAt: "asc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true, content: true, type: true, fileUrl: true, createdAt: true, readAt: true,
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      messages,
      nextCursor: messages.length === take ? messages[messages.length - 1]?.id : null,
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const { id } = await Promise.resolve(ctx.params);

    const rl = rateLimit({ key: `msg:${session.user.id}:${id}`, ...RL.message });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const az     = await authorize(id, session.user.id);
    if (!az.ok)  return NextResponse.json({ message: az.msg }, { status: az.code });
    if (az.consultation.status !== "IN_PROGRESS") {
      return NextResponse.json({ message: "Consulta encerrada" }, { status: 409 });
    }

    const body   = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const msg = await prisma.message.create({
      data: {
        consultationId: id,
        senderId:       session.user.id,
        type:           parsed.data.type ?? "TEXT",
        content:        parsed.data.content,
        ...(parsed.data.fileUrl ? { fileUrl: parsed.data.fileUrl } : {}),
      },
      select: {
        id: true, content: true, type: true, fileUrl: true, createdAt: true,
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    await publish({
      channel: `consultation:${id}`,
      type:    "message.new",
      data:    msg,
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
