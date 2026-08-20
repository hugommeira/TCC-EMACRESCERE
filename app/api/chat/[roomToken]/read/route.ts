import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { markMessagesAsRead } from "@/services/api/chat";
import { toApiError }      from "@/lib/errors";
import { prisma }          from "@/lib/prisma";

export async function POST(
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

    await markMessagesAsRead(consultation.id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
