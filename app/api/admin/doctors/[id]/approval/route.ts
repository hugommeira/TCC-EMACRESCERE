import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { z }               from "zod";
import { auth }            from "@/lib/auth";
import { toApiError, ForbiddenError } from "@/lib/errors";
import { auditLog, AuditAction } from "@/lib/audit";
import { getClientIp }     from "@/lib/security";
import { decideDoctorApproval } from "@/services/api/user";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  // Obrigatório ao reprovar (o médico vê esse texto no app).
  note: z.string().trim().max(500).optional(),
}).refine((d) => d.decision === "APPROVED" || (d.note && d.note.length >= 5), {
  message: "Informe o motivo da reprovação (mín. 5 caracteres)",
  path: ["note"],
});

/**
 * POST /api/admin/doctors/[id]/approval  { decision: "APPROVED"|"REJECTED", note? }
 * Decide o credenciamento de um médico. [id] é o id do User.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      throw new ForbiddenError();
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const updated = await decideDoctorApproval({
      doctorUserId: params.id,
      adminId:      session.user.id,
      decision:     parsed.data.decision,
      note:         parsed.data.note,
    });

    auditLog({
      actorId:    session.user.id,
      actorEmail: session.user.email,
      action:     parsed.data.decision === "APPROVED" ? AuditAction.DOCTOR_APPROVED : AuditAction.DOCTOR_REJECTED,
      entity:     "DoctorProfile",
      entityId:   updated.id,
      after:      { approvalStatus: updated.approvalStatus, note: updated.approvalNote },
      ip:         getClientIp(req),
    });

    return NextResponse.json({
      data: {
        userId:         updated.userId,
        approvalStatus: updated.approvalStatus,
        approvalNote:   updated.approvalNote,
        approvedAt:     updated.approvedAt,
      },
      message: parsed.data.decision === "APPROVED"
        ? `Dr(a). ${updated.user.name} credenciado(a)`
        : `Cadastro de ${updated.user.name} reprovado`,
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
