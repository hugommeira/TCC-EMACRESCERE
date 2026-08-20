import { NextResponse }     from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { presignDownload }   from "@/lib/s3";
import { toApiError }        from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — Resumo completo da consulta: prontuário, prescrição, anexos.
 * Acesso: paciente dono, médico autor, admin.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await Promise.resolve(ctx.params);

    const c = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true, name: true, email: true, cpf: true,
            patientProfile: { select: { birthDate: true, gender: true, bloodType: true, allergies: true, medications: true } },
          },
        },
        doctor: {
          select: {
            id: true, name: true,
            doctorProfile: { select: { crm: true, crmState: true, specialty: true } },
          },
        },
        payment: { select: { amount: true, method: true, status: true, paidAt: true } },
        prescription: {
          include: { items: { orderBy: { order: "asc" } } },
        },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!c) return NextResponse.json({ message: "Consulta não encontrada" }, { status: 404 });

    const allowed =
      c.patientId === session.user.id ||
      c.doctorId  === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";
    if (!allowed) return NextResponse.json({ message: "Sem permissão" }, { status: 403 });

    // Anexos com URL temporária de download
    const attachments = await Promise.all(
      c.attachments.map(async (a) => ({
        id:          a.id,
        kind:        a.kind,
        fileName:    a.fileName,
        mimeType:    a.mimeType,
        size:        a.size,
        description: a.description,
        createdAt:   a.createdAt,
        downloadUrl: await presignDownload({ key: a.s3Key, fileName: a.fileName, expiresIn: 600 }),
      })),
    );

    // Não expor notas internas pro paciente
    const showNotes =
      c.doctorId === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    return NextResponse.json({
      consultation: {
        id:             c.id,
        status:         c.status,
        createdAt:      c.createdAt,
        startedAt:      c.startedAt,
        endedAt:        c.endedAt,
        chiefComplaint: c.chiefComplaint,
        diagnosis:      c.diagnosis,
        conduct:        c.conduct,
        notes:          showNotes ? c.notes : null,
        patient: c.patient,
        doctor:  c.doctor,
        payment: c.payment
          ? {
              ...c.payment,
              amount: Number(c.payment.amount),
            }
          : null,
        prescription: c.prescription,
        attachments,
      },
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
