import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { toApiError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      throw new ForbiddenError();
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new NotFoundError("Usuário");

    // Impedir desativar a si mesmo
    if (target.id === session.user.id) {
      return NextResponse.json(
        { message: "Não é possível desativar sua própria conta" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data:  { active: !target.active },
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     updated.active ? "user.activated" : "user.deactivated",
      entity:     "User",
      entityId:   params.id,
      before:     { active: target.active },
      after:      { active: updated.active },
    });

    return NextResponse.json({
      data:    { id: updated.id, active: updated.active },
      message: updated.active ? "Usuário ativado" : "Usuário desativado",
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
