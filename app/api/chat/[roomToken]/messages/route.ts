import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { sendMessage, getMessageHistory } from "@/services/api/chat";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

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
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const consultation = await prisma.consultation.findFirst({
      where: { roomToken: params.roomToken },
    });

    if (!consultation) {
      return apiError("CHAT_SALA_NAO_ENCONTRADA");
    }

    const messages = await getMessageHistory(consultation.id, session.user.id);
    return NextResponse.json({ data: messages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomToken: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const body   = await readJson(req);
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const consultation = await prisma.consultation.findFirst({
      where: { roomToken: params.roomToken },
    });

    if (!consultation) {
      return apiError("CHAT_SALA_NAO_ENCONTRADA");
    }

    const message = await sendMessage(
      consultation.id,
      session.user.id,
      parsed.data.content,
      parsed.data.type,
    );

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
