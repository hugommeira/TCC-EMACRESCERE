import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { markMessagesAsRead } from "@/services/api/chat";
import { prisma }          from "@/lib/prisma";
import { apiError, handleRouteError } from "@/lib/api-response";

export async function POST(
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

    await markMessagesAsRead(consultation.id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
