import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { sendMessage, getMessageHistory } from "@/services/api/chat";
import { toApiError } from "@/lib/errors";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  type:    z.enum(["TEXT", "IMAGE", "FILE"]).optional().default("TEXT"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomToken: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const consultation = await prisma.consultation.findFirst({
      where: { roomToken: params.roomToken },
    });

    if (!consultation) {
      return NextResponse.json({ message: "Sala não encontrada" }, { status: 404 });
    }

    const messages = await getMessageHistory(consultation.id, session.user.id);
    return NextResponse.json({ data: messages });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomToken: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const consultation = await prisma.consultation.findFirst({
      where: { roomToken: params.roomToken },
    });

    if (!consultation) {
      return NextResponse.json({ message: "Sala não encontrada" }, { status: 404 });
    }

    const message = await sendMessage(
      consultation.id,
      session.user.id,
      parsed.data.content,
      parsed.data.type,
    );

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
