import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { auditLog, AuditAction } from "@/lib/audit";
import { checkOrigin, RL, rateLimit, tooManyRequests } from "@/lib/security";
import { removeAvatar, saveAvatar } from "@/services/api/profile";
import { AVATAR_MAX_BYTES }  from "@/lib/validations/profile";
import { apiError, handleRouteError, readFormData } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/profile/avatar — multipart com `file` (JPG, PNG ou WebP, até 2 MB). */
export async function POST(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const rl = rateLimit({ key: `avatar:${session.user.id}`, ...RL.avatar });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    const form = await readFormData(req);
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) return apiError("ARQUIVO_AUSENTE");
    if (file.size > AVATAR_MAX_BYTES) return apiError("PERFIL_FOTO_GRANDE");

    const avatarUrl = await saveAvatar(session.user.id, new Uint8Array(await file.arrayBuffer()));

    auditLog({
      actorId: session.user.id, action: AuditAction.AVATAR_UPDATED,
      entity: "User", entityId: session.user.id, after: { foto: "trocada" },
    });

    return NextResponse.json({ data: { avatarUrl } });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/profile/avatar — volta para as iniciais. */
export async function DELETE(req: NextRequest) {
  try {
    const originErr = checkOrigin(req);
    if (originErr) return originErr;

    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const rl = rateLimit({ key: `avatar:${session.user.id}`, ...RL.avatar });
    if (!rl.ok) return tooManyRequests(rl.resetSeconds);

    await removeAvatar(session.user.id);

    auditLog({
      actorId: session.user.id, action: AuditAction.AVATAR_UPDATED,
      entity: "User", entityId: session.user.id, after: { foto: "removida" },
    });

    return NextResponse.json({ data: { avatarUrl: null } });
  } catch (error) {
    return handleRouteError(error);
  }
}
