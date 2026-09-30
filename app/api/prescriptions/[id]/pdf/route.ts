import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { toApiError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { getObjectBuffer }   from "@/lib/s3";
import { regeneratePrescriptionPdf } from "@/services/api/prescription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — Stream do PDF da receita assinado.
 *
 * Carrega o PDF direto do S3 e devolve no response (Content-Type: application/pdf).
 * Por padrão entrega inline (visualizar no browser). Com ?download=1 força download.
 *
 * Acesso: paciente dono, médico autor, ou admin.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await Promise.resolve(ctx.params);
    const download = req.nextUrl.searchParams.get("download") === "1";

    const p = await prisma.prescription.findUnique({
      where:  { id },
      select: { signedPdfKey: true, patientId: true, doctorId: true, status: true },
    });
    if (!p) throw new NotFoundError("Receita");
    // Só o status decide. As receitas da demo estão ISSUED mas sem
    // signedPdfKey (o seed não gera arquivo) e eram recusadas como "ainda não
    // emitida" — o PDF é gerado logo abaixo.
    if (p.status !== "ISSUED") {
      throw new ConflictError("Receita ainda não emitida");
    }

    const allowed =
      p.patientId === session.user.id ||
      p.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) throw new ForbiddenError();

    // Antes lia direto do S3, que nunca foi configurado: nenhuma receita abria.
    // Agora passa pela camada de storage (S3 ou banco) e, se o arquivo não
    // existir — caso de todas as receitas da demo —, o PDF é gerado de novo a
    // partir dos dados gravados.
    const stored = p.signedPdfKey ? await getObjectBuffer(p.signedPdfKey) : null;
    const buffer = stored?.body ?? await regeneratePrescriptionPdf(id);

    const fileName = `receita-${id.slice(-8)}.pdf`;
    const disposition = download
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Length":      String(buffer.length),
        "Content-Disposition": disposition,
        "Cache-Control":       "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[/api/prescriptions/:id/pdf] error:", error);
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
