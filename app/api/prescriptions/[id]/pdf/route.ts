import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { toApiError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";

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
    if (p.status !== "ISSUED" || !p.signedPdfKey) {
      throw new ConflictError("Receita ainda não emitida");
    }

    const allowed =
      p.patientId === session.user.id ||
      p.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) throw new ForbiddenError();

    // Stream do S3 → cliente
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint:       process.env["S3_ENDPOINT"]!,
      region:         process.env["S3_REGION"]!,
      forcePathStyle: true,
      credentials: {
        accessKeyId:     process.env["S3_ACCESS_KEY"]!,
        secretAccessKey: process.env["S3_SECRET_KEY"]!,
      },
    });

    const r = await s3.send(new GetObjectCommand({
      Bucket: process.env["S3_BUCKET"]!,
      Key:    p.signedPdfKey,
    }));

    if (!r.Body) throw new NotFoundError("Arquivo do PDF não encontrado");

    const chunks: Buffer[] = [];
    for await (const chunk of r.Body as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const fileName = `receita-${id.slice(-8)}.pdf`;
    const disposition = download
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`;

    return new Response(buffer, {
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
