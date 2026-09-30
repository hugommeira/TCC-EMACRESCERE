import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { getObjectBuffer, readDownloadToken } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/files/:token — download de arquivo guardado no banco (modo sem S3).
 *
 * O token é gerado por presignDownload() em lib/s3.ts, depois que a rota que o
 * emitiu já conferiu a permissão (ex.: só paciente/médico da consulta pegam o
 * link de um anexo). Aqui só se confere a assinatura e a validade — mesmo
 * modelo do presigned URL do S3.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const claims = readDownloadToken(params.token);
  if (!claims) {
    return NextResponse.json({ message: "Link inválido ou expirado" }, { status: 403 });
  }

  const file = await getObjectBuffer(claims.k);
  if (!file) {
    return NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
  }

  const name = (claims.f ?? claims.k.split("/").pop() ?? "arquivo").replace(/["\r\n]/g, "");
  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type":        file.contentType,
      "Content-Length":      String(file.body.length),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control":       "private, no-store",
    },
  });
}
