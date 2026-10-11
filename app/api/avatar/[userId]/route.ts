import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { readAvatar }        from "@/services/api/profile";
import { apiError, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/avatar/[userId] — a foto de perfil. Exige login (a foto do
 * paciente não é pública). O ?v= do avatarUrl muda a cada troca, então o
 * navegador pode guardar a imagem por bastante tempo.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ userId: string }> | { userId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const { userId } = await Promise.resolve(ctx.params);
    const file = await readAvatar(userId);
    if (!file) return apiError("ARQUIVO_NAO_ENCONTRADO");

    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type":            file.contentType,
        "Cache-Control":           "private, max-age=604800, immutable",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options":  "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
