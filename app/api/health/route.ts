import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checarSaude } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — saúde das peças críticas do sistema.
 *
 * Público só com o estado geral (para monitoramento externo); a lista por
 * componente, que revela a configuração do servidor, só para administradores.
 * Responde 503 quando o banco está fora.
 */
export async function GET() {
  const saude = await checarSaude();
  const httpStatus = saude.status === "fora" ? 503 : 200;

  let admin = false;
  try {
    const session = await auth();
    admin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  } catch {
    /* sem sessão legível (ex.: banco fora): resposta pública */
  }

  return NextResponse.json(
    admin ? saude : { status: saude.status, verificadoEm: saude.verificadoEm },
    { status: httpStatus, headers: { "Cache-Control": "no-store" } },
  );
}
