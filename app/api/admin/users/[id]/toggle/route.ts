import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import { apiError, handleRouteError } from "@/lib/api-response";

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
      throw new AppError("AUTH_SEM_PERMISSAO");
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new AppError("USUARIO_NAO_ENCONTRADO");

    // Impedir desativar a si mesmo
    if (target.id === session.user.id) {
      return apiError("ADMIN_AUTODESATIVACAO");
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
    return handleRouteError(error);
  }
}
